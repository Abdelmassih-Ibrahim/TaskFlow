import type { Database } from "@/lib/supabase/database.types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export type TaskWithProject = Task & {
  project: Pick<Project, "id" | "name">;
};

export type WorkspaceData = {
  projects: Project[];
  tasks: TaskWithProject[];
  error: string | null;
};

export const taskStatuses = ["todo", "in_progress", "done"] as const;
export const taskPriorities = ["low", "medium", "high"] as const;

export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];

export const memberRoles = ["viewer", "editor", "admin", "reporter"] as const;
export type MemberRole = (typeof memberRoles)[number];

export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"] & {
  userEmail?: string;
  userName?: string;
};

export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];

export type ProjectWithMembers = Project & {
  isShared: boolean;
  members?: ProjectMember[];
  invitations?: Invitation[];
};
