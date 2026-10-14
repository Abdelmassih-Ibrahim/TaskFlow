import "server-only";
import { createSupabaseServerClient } from "../supabase/server";
import type { Project, TaskWithProject, WorkspaceData } from "./types";

const emptyWorkspace: WorkspaceData = {
  projects: [],
  tasks: [],
  error: null,
};

export async function getWorkspaceData(): Promise<WorkspaceData> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ...emptyWorkspace,
      error: "Workspace data is unavailable. Check the Supabase configuration.",
    };
  }

  const {
    data: projects,
    error: projectsError,
  } = await supabase
    .from("projects")
    .select("id, owner_id, name, description, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (projectsError) {
    return {
      ...emptyWorkspace,
      error: "We couldn't load your projects. Please try again.",
    };
  }

  if (projects.length === 0) {
    return { ...emptyWorkspace, projects };
  }

  const projectById = new Map<string, Project>(
    projects.map((project) => [project.id, project]),
  );
  const {
    data: tasks,
    error: tasksError,
  } = await supabase
    .from("tasks")
    .select(
      "id, project_id, title, description, status, priority, due_date, created_at, updated_at",
    )
    .in(
      "project_id",
      projects.map((project) => project.id),
    )
    .order("due_date", { ascending: true, nullsFirst: false });

  if (tasksError) {
    return {
      ...emptyWorkspace,
      error: "We couldn't load your tasks. Please try again.",
    };
  }

  const tasksWithProjects: TaskWithProject[] = tasks.flatMap((task) => {
    const project = projectById.get(task.project_id);
    return project ? [{ ...task, project: { id: project.id, name: project.name } }] : [];
  });

  return { projects, tasks: tasksWithProjects, error: null };
}
