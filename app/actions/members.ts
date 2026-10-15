"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  inviteMemberSchema,
  acceptInvitationSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
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
    return {
      status: "error",
      message: "Kontrollera fälten nedan och försök igen.",
    };
  }

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  const isOwner = await findOwnedProject(
    context.supabase,
    parsed.data.projectId,
    context.user.id,
  );
  if (!isOwner) return actionError("Du är inte ägare av detta projekt.");

  // Generate a random invite token
  const token = crypto.getRandomValues(new Uint8Array(16)).toString();

  const { error } = await context.supabase
    .from("invitations")
    .insert({
      project_id: parsed.data.projectId,
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: context.user.id,
      token: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    });

  if (error) {
    if (error.message.includes("unique")) {
      return actionError("En inbjudan har redan skickats till denna e-postadress.");
    }
    return actionError("Det gick inte att skicka inbjudan. Försök igen.");
  }

  // TODO: Send email with invitation link
  // For now, just return success

  return actionSuccess(
    `Inbjudan skickad till ${parsed.data.email}. (E-post-integration kommer senare)`,
  );
}

export async function acceptInvitation(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = acceptInvitationSchema.safeParse({
    token: getFormString(formData, "token"),
  });

  if (!parsed.success) {
    return actionError("Ogiltig inbjudningstoken.");
  }

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  // Get invitation
  const { data: invitation, error: invitationError } = await context.supabase
    .from("invitations")
    .select("*")
    .eq("token", parsed.data.token)
    .maybeSingle();

  if (invitationError || !invitation) {
    return actionError("Inbjudningen kunde inte hittas eller är utgångslösen.");
  }

  if (invitation.accepted_at) {
    return actionError("Denna inbjudan har redan accepterats.");
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return actionError("Denna inbjudan har gått ut. Begär en ny.");
  }

  // Verify email matches
  const { data: user, error: userError } = await context.supabase.auth.getUser();
  if (userError || !user.user || user.user.email !== invitation.email) {
    return actionError(
      "Du är inloggad med en annan e-postadress än inbjudningen. Logga in med rätt e-post.",
    );
  }

  // Create project member record
  const { error: memberError } = await context.supabase
    .from("project_members")
    .insert({
      project_id: invitation.project_id,
      user_id: context.user.id,
      role: invitation.role,
      invited_by: invitation.invited_by,
      joined_at: new Date().toISOString(),
    });

  if (memberError) {
    if (memberError.message.includes("unique")) {
      return actionError("Du är redan medlem i detta projekt.");
    }
    return actionError("Det gick inte att acceptera inbjudan. Försök igen.");
  }

  // Mark invitation as accepted
  await context.supabase
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return actionSuccess("Inbjudan accepterad! Du är nu medlem i projektet.");
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

  if (!parsed.success) {
    return actionError("Ogiltig begäran. Kontrollera fälten.");
  }

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  // Verify requester is owner
  const isOwner = await findOwnedProject(
    context.supabase,
    parsed.data.projectId,
    context.user.id,
  );
  if (!isOwner) return actionError("Du är inte ägare av detta projekt.");

  // Prevent removing owner's own role
  if (parsed.data.userId === context.user.id) {
    return actionError("Du kan inte ändra din egen roll.");
  }

  const { error } = await context.supabase
    .from("project_members")
    .update({ role: parsed.data.role })
    .eq("project_id", parsed.data.projectId)
    .eq("user_id", parsed.data.userId);

  if (error) {
    return actionError("Det gick inte att uppdatera medlemmens roll. Försök igen.");
  }

  return actionSuccess("Medlemmens roll uppdaterad.");
}

export async function removeMember(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = removeMemberSchema.safeParse({
    projectId: getFormString(formData, "projectId"),
    userId: getFormString(formData, "userId"),
  });

  if (!parsed.success) {
    return actionError("Ogiltig begäran. Kontrollera fälten.");
  }

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  // Verify requester is owner
  const isOwner = await findOwnedProject(
    context.supabase,
    parsed.data.projectId,
    context.user.id,
  );
  if (!isOwner) return actionError("Du är inte ägare av detta projekt.");

  // Prevent removing yourself
  if (parsed.data.userId === context.user.id) {
    return actionError("Du kan inte ta bort dig själv från projektet.");
  }

  const { error } = await context.supabase
    .from("project_members")
    .delete()
    .eq("project_id", parsed.data.projectId)
    .eq("user_id", parsed.data.userId);

  if (error) {
    return actionError("Det gick inte att ta bort medlemmen. Försök igen.");
  }

  return actionSuccess("Medlemmen har tagits bort från projektet.");
}

export async function cancelInvitation(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const invitationId = getFormString(formData, "invitationId");

  if (!invitationId) {
    return actionError("Inbjudnings-ID krävs.");
  }

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  // Get invitation and verify ownership
  const { data: invitation, error: invitationError } = await context.supabase
    .from("invitations")
    .select("project_id")
    .eq("id", invitationId)
    .maybeSingle();

  if (invitationError || !invitation) {
    return actionError("Inbjudningen kunde inte hittas.");
  }

  const isOwner = await findOwnedProject(
    context.supabase,
    invitation.project_id,
    context.user.id,
  );
  if (!isOwner) return actionError("Du är inte ägare av detta projekt.");

  const { error } = await context.supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId);

  if (error) {
    return actionError("Det gick inte att avbryta inbjudan. Försök igen.");
  }

  return actionSuccess("Inbjudan avbruten.");
}
