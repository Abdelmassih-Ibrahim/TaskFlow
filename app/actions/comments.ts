"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import type { TaskActivity, TaskComment } from "../../lib/workspace/types";
import {
  commentSchema,
  deleteRecordSchema,
  type WorkspaceActionState,
} from "../../lib/workspace/validation";

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

async function getAuthenticatedClient(): Promise<AuthenticatedClient | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return { supabase, user: data.user };
}

export async function addComment(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = commentSchema.safeParse({
    taskId: getFormString(formData, "taskId"),
    body: getFormString(formData, "body"),
  });
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Kontrollera kommentaren.");
  }

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  const { error } = await context.supabase.from("task_comments").insert({
    task_id: parsed.data.taskId,
    author_id: context.user.id,
    body: parsed.data.body,
  });

  if (error) return actionError("Det gick inte att spara kommentaren. Försök igen.");

  revalidatePath("/");
  return { status: "success", message: "Kommentaren har sparats." };
}

export async function deleteComment(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = deleteRecordSchema.safeParse({ id: getFormString(formData, "id") });
  if (!parsed.success) return actionError("Kommentaren kunde inte hittas.");

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  const { data, error } = await context.supabase
    .from("task_comments")
    .delete()
    .eq("id", parsed.data.id)
    .eq("author_id", context.user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) return actionError("Det gick inte att ta bort kommentaren.");

  return { status: "success", message: "Kommentaren har tagits bort." };
}

export type TaskHistory = {
  comments: TaskComment[];
  activity: TaskActivity[];
};

export async function loadTaskHistory(taskId: string): Promise<TaskHistory | null> {
  const parsed = deleteRecordSchema.safeParse({ id: taskId });
  if (!parsed.success) return null;

  const context = await getAuthenticatedClient();
  if (!context) return null;

  const [comments, activity] = await Promise.all([
    context.supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true }),
    context.supabase
      .from("task_activity")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (comments.error || activity.error) return null;

  return {
    comments: comments.data,
    activity: activity.data,
  };
}
