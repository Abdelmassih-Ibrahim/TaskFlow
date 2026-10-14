import { formatDueDate } from "../date-utils";
import type { TaskStatus, TaskWithProject } from "./types";

export type TaskFilters = {
  search: string;
  status: TaskStatus | "all";
  projectId: string;
  sort: "due_date" | "title" | "priority" | "status";
};

export type WorkspaceSummary = {
  total: number;
  completed: number;
  overdue: number;
};

const priorityOrder = { high: 0, medium: 1, low: 2 } as const;

export function getWorkspaceSummary(
  tasks: TaskWithProject[],
  today = new Date(),
): WorkspaceSummary {
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === "done").length,
    overdue: tasks.filter(
      (task) =>
        task.status !== "done" &&
        task.due_date !== null &&
        task.due_date < todayKey,
    ).length,
  };
}

export function isWorkspaceTaskOverdue(
  task: TaskWithProject,
  today = new Date(),
): boolean {
  if (task.status === "done" || !task.due_date) return false;
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return task.due_date < todayKey;
}

export function filterAndSortTasks(
  tasks: TaskWithProject[],
  filters: TaskFilters,
): TaskWithProject[] {
  const search = filters.search.trim().toLocaleLowerCase();
  const filtered = tasks.filter((task) => {
    const matchesSearch =
      !search ||
      task.title.toLocaleLowerCase().includes(search) ||
      (task.description ?? "").toLocaleLowerCase().includes(search) ||
      task.project.name.toLocaleLowerCase().includes(search);

    return (
      matchesSearch &&
      (filters.status === "all" || task.status === filters.status) &&
      (!filters.projectId || task.project_id === filters.projectId)
    );
  });

  return filtered.toSorted((left, right) => {
    if (filters.sort === "title") {
      return left.title.localeCompare(right.title);
    }
    if (filters.sort === "priority") {
      return priorityOrder[left.priority] - priorityOrder[right.priority];
    }
    if (filters.sort === "status") {
      return left.status.localeCompare(right.status);
    }
    return (
      (left.due_date ?? "9999-12-31").localeCompare(
        right.due_date ?? "9999-12-31",
      ) || left.title.localeCompare(right.title)
    );
  });
}

export { formatDueDate };
