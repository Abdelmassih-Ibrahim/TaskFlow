"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  inviteMemberSchema,
  removeMemberSchema,
  updateMemberRoleSchema,
  type WorkspaceActionState,
} from "@/lib/workspace/validation";

type AuthenticatedClient = {
  supabase: SupabaseClient<Database>;
  user: User;
};

function getFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function actionError(message: string): WorkspaceActionState {
  return { status: "error", message };
}

function actionSuccess(message: string): WorkspaceActionState {
  revalidatePath("/");
  return { status: "success", message };
}

async function getAuthenticatedClient(): Promise<AuthenticatedClient | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return { supabase, user: data.user };
}

async function findOwnedProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .maybeSingle();

  return !error && data !== null;
}

export async function inviteMemberToProject(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = inviteMemberSchema.safeParse({
    projectId: getFormString(formData, "projectId"),
    email: getFormString(formData, "email"),
    role: getFormString(formData, "role"),
  });
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Kontrollera fälten och försök igen.");
  }

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  if (!(await findOwnedProject(context.supabase, parsed.data.projectId, context.user.id))) {
    return actionError("Bara projektets ägare kan bjuda in medlemmar.");
  }

  const token = randomBytes(24).toString("base64url");
  const email = parsed.data.email.toLowerCase();

  const { error } = await context.supabase.from("invitations").insert({
    project_id: parsed.data.projectId,
    email,
    role: parsed.data.role,
    invited_by: context.user.id,
    token,
  });

  if (error) {
    if (error.message.includes("unique")) {
      return actionError("Det finns redan en väntande inbjudan till denna e-postadress.");
    }
    return actionError("Det gick inte att skapa inbjudan. Försök igen.");
  }

  revalidatePath(`/projects/${parsed.data.projectId}/members`);
  return actionSuccess(`Inbjudan skapad för ${email}. Kopiera länken och skicka den till personen.`);
}

export async function changeMemberRole(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = updateMemberRoleSchema.safeParse({
    projectId: getFormString(formData, "projectId"),
    userId: getFormString(formData, "userId"),
    role: getFormString(formData, "role"),
  });
  if (!parsed.success) return actionError("Ogiltig begäran. Kontrollera fälten.");

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  if (!(await findOwnedProject(context.supabase, parsed.data.projectId, context.user.id))) {
    return actionError("Bara projektets ägare kan ändra roller.");
  }
  if (parsed.data.userId === context.user.id) {
    return actionError("Du kan inte ändra din egen roll.");
  }

  const { data, error } = await context.supabase
    .from("project_members")
    .update({ role: parsed.data.role })
    .eq("project_id", parsed.data.projectId)
    .eq("user_id", parsed.data.userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError("Det gick inte att uppdatera medlemmens roll. Försök igen.");
  }

  return actionSuccess("Medlemmens roll har uppdaterats.");
}

export async function removeMember(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = removeMemberSchema.safeParse({
    projectId: getFormString(formData, "projectId"),
    userId: getFormString(formData, "userId"),
  });
  if (!parsed.success) return actionError("Ogiltig begäran. Kontrollera fälten.");

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  if (!(await findOwnedProject(context.supabase, parsed.data.projectId, context.user.id))) {
    return actionError("Bara projektets ägare kan ta bort medlemmar.");
  }
  if (parsed.data.userId === context.user.id) {
    return actionError("Du kan inte ta bort dig själv från projektet.");
  }

  const { data, error } = await context.supabase
    .from("project_members")
    .delete()
    .eq("project_id", parsed.data.projectId)
    .eq("user_id", parsed.data.userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError("Det gick inte att ta bort medlemmen. Försök igen.");
  }

  return actionSuccess("Medlemmen har tagits bort från projektet.");
}

export async function cancelInvitation(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const invitationId = getFormString(formData, "invitationId");
  if (!invitationId) return actionError("Inbjudan kunde inte hittas.");

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  const { data, error } = await context.supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .select("id")
    .maybeSingle();

  if (error || !data) return actionError("Det gick inte att avbryta inbjudan. Försök igen.");

  return actionSuccess("Inbjudan har avbrutits.");
}
