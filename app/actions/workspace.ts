"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import {
  createProjectSchema,
  createTaskSchema,
  deleteRecordSchema,
  updateProjectSchema,
  updateTaskSchema,
  type WorkspaceActionState,
  type WorkspaceFieldErrors,
} from "../../lib/workspace/validation";

type AuthenticatedClient = {
  supabase: SupabaseClient<Database>;
  user: User;
};

function getFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getIssueErrors(
  issues: { path: PropertyKey[]; message: string }[],
): WorkspaceFieldErrors {
  const errors: WorkspaceFieldErrors = {};
  const fieldNames = [
    "name",
    "description",
    "title",
    "projectId",
    "status",
    "priority",
    "dueDate",
  ] as const;

  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    const recognizedField = fieldNames.find((fieldName) => fieldName === field);
    if (recognizedField && !errors[recognizedField]) {
      errors[recognizedField] = issue.message;
    }
  }

  return errors;
}

function validationFailure(
  issues: { path: PropertyKey[]; message: string }[],
): WorkspaceActionState {
  return {
    status: "error",
    message: "Check the fields below and try again.",
    fieldErrors: getIssueErrors(issues),
  };
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

async function findOwnedTask(
  supabase: SupabaseClient<Database>,
  taskId: string,
): Promise<{ id: string; project_id: string } | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, project_id")
    .eq("id", taskId)
    .maybeSingle();

  return error ? null : data;
}

export async function createProject(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = createProjectSchema.safeParse({
    name: getFormString(formData, "name"),
    description: getFormString(formData, "description"),
  });
  if (!parsed.success) return validationFailure(parsed.error.issues);

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Your session has expired. Sign in again.");

  const { error } = await context.supabase.from("projects").insert({
    owner_id: context.user.id,
    name: parsed.data.name,
    description: parsed.data.description,
  });

  if (error) {
    return actionError("We couldn't create this project. Please try again.");
  }

  return actionSuccess("Project created.");
}

export async function updateProject(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = updateProjectSchema.safeParse({
    id: getFormString(formData, "id"),
    name: getFormString(formData, "name"),
    description: getFormString(formData, "description"),
  });
  if (!parsed.success) return validationFailure(parsed.error.issues);

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Your session has expired. Sign in again.");

  const isOwner = await findOwnedProject(
    context.supabase,
    parsed.data.id,
    context.user.id,
  );
  if (!isOwner) return actionError("That project is unavailable.");

  const { data, error } = await context.supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
    })
    .eq("id", parsed.data.id)
    .eq("owner_id", context.user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError("We couldn't update this project. Please try again.");
  }

  return actionSuccess("Project updated.");
}

export async function deleteProject(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = deleteRecordSchema.safeParse({
    id: getFormString(formData, "id"),
  });
  if (!parsed.success) return validationFailure(parsed.error.issues);

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Your session has expired. Sign in again.");

  const isOwner = await findOwnedProject(
    context.supabase,
    parsed.data.id,
    context.user.id,
  );
  if (!isOwner) return actionError("That project is unavailable.");

  const { data, error } = await context.supabase
    .from("projects")
    .delete()
    .eq("id", parsed.data.id)
    .eq("owner_id", context.user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError("We couldn't delete this project. Please try again.");
  }

  return actionSuccess(
    "Project and its tasks were deleted.",
  );
}

export async function createTask(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = createTaskSchema.safeParse({
    projectId: getFormString(formData, "projectId"),
    title: getFormString(formData, "title"),
    description: getFormString(formData, "description"),
    status: getFormString(formData, "status"),
    priority: getFormString(formData, "priority"),
    dueDate: getFormString(formData, "dueDate"),
  });
  if (!parsed.success) return validationFailure(parsed.error.issues);

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Your session has expired. Sign in again.");

  const isOwner = await findOwnedProject(
    context.supabase,
    parsed.data.projectId,
    context.user.id,
  );
  if (!isOwner) {
    return actionError("Choose a project in your workspace.");
  }

  const { error } = await context.supabase.from("tasks").insert({
    project_id: parsed.data.projectId,
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
    priority: parsed.data.priority,
    due_date: parsed.data.dueDate,
  });

  if (error) {
    return actionError("We couldn't create this task. Please try again.");
  }

  return actionSuccess("Task created.");
}

export async function updateTask(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = updateTaskSchema.safeParse({
    id: getFormString(formData, "id"),
    projectId: getFormString(formData, "projectId"),
    title: getFormString(formData, "title"),
    description: getFormString(formData, "description"),
    status: getFormString(formData, "status"),
    priority: getFormString(formData, "priority"),
    dueDate: getFormString(formData, "dueDate"),
  });
  if (!parsed.success) return validationFailure(parsed.error.issues);

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Your session has expired. Sign in again.");

  const existingTask = await findOwnedTask(context.supabase, parsed.data.id);
  if (!existingTask) return actionError("That task is unavailable.");

  const isOwner = await findOwnedProject(
    context.supabase,
    parsed.data.projectId,
    context.user.id,
  );
  if (!isOwner) {
    return actionError("Choose a project in your workspace.");
  }

  const { data, error } = await context.supabase
    .from("tasks")
    .update({
      project_id: parsed.data.projectId,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      due_date: parsed.data.dueDate,
    })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError("We couldn't update this task. Please try again.");
  }

  return actionSuccess("Task updated.");
}

export async function deleteTask(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = deleteRecordSchema.safeParse({
    id: getFormString(formData, "id"),
  });
  if (!parsed.success) return validationFailure(parsed.error.issues);

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Your session has expired. Sign in again.");

  const existingTask = await findOwnedTask(context.supabase, parsed.data.id);
  if (!existingTask) return actionError("That task is unavailable.");

  const isOwner = await findOwnedProject(
    context.supabase,
    existingTask.project_id,
    context.user.id,
  );
  if (!isOwner) return actionError("That task is unavailable.");

  const { data, error } = await context.supabase
    .from("tasks")
    .delete()
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError("We couldn't delete this task. Please try again.");
  }

  return actionSuccess("Task deleted.");
}
