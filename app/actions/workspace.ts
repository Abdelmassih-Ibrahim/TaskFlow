"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import type { MemberRole } from "../../lib/workspace/types";
import {
  createProjectSchema,
  createSprintSchema,
  createTaskSchema,
  deleteRecordSchema,
  reorderTasksSchema,
  updateProjectSchema,
  updateTaskSchema,
  type WorkspaceActionState,
  type WorkspaceFieldErrors,
} from "../../lib/workspace/validation";

type AuthenticatedClient = {
  supabase: SupabaseClient<Database>;
  user: User;
};

const fieldNames = [
  "name",
  "description",
  "title",
  "projectId",
  "status",
  "priority",
  "dueDate",
  "assigneeId",
  "sprintId",
  "labels",
  "startsOn",
  "endsOn",
] as const;

function getFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getIssueErrors(
  issues: { path: PropertyKey[]; message: string }[],
): WorkspaceFieldErrors {
  const errors: WorkspaceFieldErrors = {};

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
    message: "Kontrollera fälten nedan och försök igen.",
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

async function getProjectRole(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string,
): Promise<MemberRole | null> {
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .not("joined_at", "is", null)
    .maybeSingle();

  return error || !data ? null : data.role;
}

async function canEditProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string,
): Promise<boolean> {
  const role = await getProjectRole(supabase, projectId, userId);
  return role === "admin" || role === "editor";
}

async function findTask(
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

async function isProjectMember(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string,
): Promise<boolean> {
  return (await getProjectRole(supabase, projectId, userId)) !== null;
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
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  const { error } = await context.supabase.from("projects").insert({
    owner_id: context.user.id,
    name: parsed.data.name,
    description: parsed.data.description,
  });

  if (error) {
    return actionError("Det gick inte att skapa projektet. Försök igen.");
  }

  return actionSuccess("Projektet har skapats.");
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
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  const isOwner = await findOwnedProject(
    context.supabase,
    parsed.data.id,
    context.user.id,
  );
  if (!isOwner) return actionError("Projektet är inte tillgängligt.");

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
    return actionError("Det gick inte att uppdatera projektet. Försök igen.");
  }

  return actionSuccess("Projektet har uppdaterats.");
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
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  const isOwner = await findOwnedProject(
    context.supabase,
    parsed.data.id,
    context.user.id,
  );
  if (!isOwner) return actionError("Projektet är inte tillgängligt.");

  const { data, error } = await context.supabase
    .from("projects")
    .delete()
    .eq("id", parsed.data.id)
    .eq("owner_id", context.user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError("Det gick inte att ta bort projektet. Försök igen.");
  }

  return actionSuccess("Projektet och dess uppgifter har tagits bort.");
}

export async function createSprint(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = createSprintSchema.safeParse({
    projectId: getFormString(formData, "projectId"),
    name: getFormString(formData, "name"),
    startsOn: getFormString(formData, "startsOn"),
    endsOn: getFormString(formData, "endsOn"),
  });
  if (!parsed.success) return validationFailure(parsed.error.issues);

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  const role = await getProjectRole(context.supabase, parsed.data.projectId, context.user.id);
  if (role !== "admin") return actionError("Bara administratörer kan skapa sprintar.");

  const { error } = await context.supabase.from("sprints").insert({
    project_id: parsed.data.projectId,
    name: parsed.data.name,
    starts_on: parsed.data.startsOn,
    ends_on: parsed.data.endsOn,
  });

  if (error) return actionError("Det gick inte att skapa sprinten. Försök igen.");

  return actionSuccess("Sprinten har skapats.");
}

export async function deleteSprint(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = deleteRecordSchema.safeParse({
    id: getFormString(formData, "id"),
  });
  if (!parsed.success) return validationFailure(parsed.error.issues);

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  const { data, error } = await context.supabase
    .from("sprints")
    .delete()
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError("Det gick inte att ta bort sprinten. Försök igen.");
  }

  return actionSuccess("Sprinten har tagits bort. Uppgifterna ligger kvar utan sprint.");
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
    assigneeId: getFormString(formData, "assigneeId"),
    sprintId: getFormString(formData, "sprintId"),
    labels: getFormString(formData, "labels"),
  });
  if (!parsed.success) return validationFailure(parsed.error.issues);

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  if (!(await canEditProject(context.supabase, parsed.data.projectId, context.user.id))) {
    return actionError("Du har inte behörighet att skapa uppgifter i detta projekt.");
  }

  if (
    parsed.data.assigneeId &&
    !(await isProjectMember(context.supabase, parsed.data.projectId, parsed.data.assigneeId))
  ) {
    return actionError("Personen är inte medlem i projektet.");
  }

  const { error } = await context.supabase.from("tasks").insert({
    project_id: parsed.data.projectId,
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
    priority: parsed.data.priority,
    due_date: parsed.data.dueDate,
    assignee_id: parsed.data.assigneeId,
    sprint_id: parsed.data.sprintId,
    labels: parsed.data.labels,
    position: Date.now(),
  });

  if (error) {
    return actionError("Det gick inte att skapa uppgiften. Försök igen.");
  }

  return actionSuccess("Uppgiften har skapats.");
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
    assigneeId: getFormString(formData, "assigneeId"),
    sprintId: getFormString(formData, "sprintId"),
    labels: getFormString(formData, "labels"),
  });
  if (!parsed.success) return validationFailure(parsed.error.issues);

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  const existingTask = await findTask(context.supabase, parsed.data.id);
  if (!existingTask) return actionError("Uppgiften är inte tillgänglig.");

  if (
    !(await canEditProject(context.supabase, existingTask.project_id, context.user.id)) ||
    !(await canEditProject(context.supabase, parsed.data.projectId, context.user.id))
  ) {
    return actionError("Du har inte behörighet att ändra denna uppgift.");
  }

  if (
    parsed.data.assigneeId &&
    !(await isProjectMember(context.supabase, parsed.data.projectId, parsed.data.assigneeId))
  ) {
    return actionError("Personen är inte medlem i projektet.");
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
      assignee_id: parsed.data.assigneeId,
      sprint_id: parsed.data.sprintId,
      labels: parsed.data.labels,
    })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError("Det gick inte att uppdatera uppgiften. Försök igen.");
  }

  return actionSuccess("Uppgiften har uppdaterats.");
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
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  const existingTask = await findTask(context.supabase, parsed.data.id);
  if (!existingTask) return actionError("Uppgiften är inte tillgänglig.");

  const role = await getProjectRole(context.supabase, existingTask.project_id, context.user.id);
  if (role !== "admin") {
    return actionError("Bara administratörer kan ta bort uppgifter.");
  }

  const { data, error } = await context.supabase
    .from("tasks")
    .delete()
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError("Det gick inte att ta bort uppgiften. Försök igen.");
  }

  return actionSuccess("Uppgiften har tagits bort.");
}

export async function reorderTasks(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  let taskIds: unknown;
  try {
    taskIds = JSON.parse(getFormString(formData, "taskIds"));
  } catch {
    return actionError("Ogiltig ordning på uppgifterna.");
  }

  const parsed = reorderTasksSchema.safeParse({
    projectId: getFormString(formData, "projectId"),
    status: getFormString(formData, "status"),
    taskIds,
  });
  if (!parsed.success) return actionError("Ogiltig ordning på uppgifterna.");

  const context = await getAuthenticatedClient();
  if (!context) return actionError("Din session har gått ut. Logga in igen.");

  if (!(await canEditProject(context.supabase, parsed.data.projectId, context.user.id))) {
    return actionError("Du har inte behörighet att ändra uppgifterna i detta projekt.");
  }

  const results = await Promise.all(
    parsed.data.taskIds.map((taskId, index) =>
      context.supabase
        .from("tasks")
        .update({ status: parsed.data.status, position: index + 1 })
        .eq("id", taskId)
        .eq("project_id", parsed.data.projectId)
        .select("id")
        .maybeSingle(),
    ),
  );

  if (results.some((result) => result.error || !result.data)) {
    return actionError("Det gick inte att spara ordningen. Försök igen.");
  }

  return actionSuccess("Uppgifterna har uppdaterats.");
}
