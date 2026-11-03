import "server-only";
import { createSupabaseServerClient } from "../supabase/server";
import type {
  Project,
  ProjectMember,
  Sprint,
  TaskWithProject,
  WorkspaceData,
} from "./types";

const emptyWorkspace: WorkspaceData = {
  currentUserId: null,
  currentUserEmail: null,
  projects: [],
  tasks: [],
  members: [],
  sprints: [],
  error: null,
};

export async function getWorkspaceData(): Promise<WorkspaceData> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ...emptyWorkspace,
      error: "Arbetsytans data är inte tillgänglig. Kontrollera Supabase-konfigurationen.",
    };
  }

  const { data: userData } = await supabase.auth.getUser();
  const currentUser = {
    currentUserId: userData.user?.id ?? null,
    currentUserEmail: userData.user?.email ?? null,
  };

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, owner_id, name, description, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (projectsError) {
    return {
      ...emptyWorkspace,
      ...currentUser,
      error: "Det gick inte att läsa in dina projekt. Försök igen.",
    };
  }

  if (projects.length === 0) {
    return { ...emptyWorkspace, ...currentUser, projects: projects as Project[] };
  }

  const projectIds = projects.map((project) => project.id);
  const projectById = new Map<string, Project>(
    projects.map((project) => [project.id, project as Project]),
  );

  const [tasksResult, membersResult, sprintsResult] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "id, project_id, title, description, status, priority, due_date, assignee_id, labels, position, sprint_id, created_at, updated_at",
      )
      .in("project_id", projectIds)
      .order("position", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("project_members")
      .select("*")
      .in("project_id", projectIds)
      .not("joined_at", "is", null),
    supabase
      .from("sprints")
      .select("*")
      .in("project_id", projectIds)
      .order("starts_on", { ascending: true, nullsFirst: false }),
  ]);

  if (tasksResult.error) {
    return {
      ...emptyWorkspace,
      ...currentUser,
      error: "Det gick inte att läsa in dina uppgifter. Försök igen.",
    };
  }

  const tasksWithProjects: TaskWithProject[] = tasksResult.data.flatMap((task) => {
    const project = projectById.get(task.project_id);
    return project ? [{ ...task, project: { id: project.id, name: project.name } }] : [];
  });

  return {
    ...currentUser,
    projects: projects as Project[],
    tasks: tasksWithProjects,
    members: (membersResult.data ?? []) as ProjectMember[],
    sprints: (sprintsResult.data ?? []) as Sprint[],
    error: null,
  };
}
