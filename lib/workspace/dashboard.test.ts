import { describe, expect, it } from "vitest";
import {
  filterAndSortTasks,
  getProjectProgress,
  getWorkspaceSummary,
  isWorkspaceTaskOverdue,
} from "./dashboard";
import type { TaskWithProject } from "./types";

const project = {
  id: "a8f5a1ea-64c2-42fd-ae86-5d39cf9e5b05",
  name: "Website",
};

const tasks: TaskWithProject[] = [
  {
    id: "task-a",
    project_id: project.id,
    project,
    title: "Write launch notes",
    description: null,
    status: "in_progress",
    priority: "high",
    due_date: "2026-10-12",
    created_at: "",
    updated_at: "",
  },
  {
    id: "task-b",
    project_id: project.id,
    project,
    title: "Review handoff",
    description: "Check details",
    status: "done",
    priority: "low",
    due_date: "2026-10-10",
    created_at: "",
    updated_at: "",
  },
  {
    id: "task-c",
    project_id: "a8f5a1ea-64c2-42fd-ae86-5d39cf9e5b06",
    project: {
      id: "a8f5a1ea-64c2-42fd-ae86-5d39cf9e5b06",
      name: "Mobile",
    },
    title: "Prepare demo",
    description: null,
    status: "todo",
    priority: "medium",
    due_date: null,
    created_at: "",
    updated_at: "",
  },
];

const today = new Date(2026, 9, 14);

describe("workspace task summary", () => {
  it("counts completed and unfinished overdue tasks from persisted fields", () => {
    expect(getWorkspaceSummary(tasks, today)).toEqual({
      total: 3,
      completed: 1,
      overdue: 1,
    });
    expect(isWorkspaceTaskOverdue(tasks[0], today)).toBe(true);
    expect(isWorkspaceTaskOverdue(tasks[1], today)).toBe(false);
    expect(isWorkspaceTaskOverdue(tasks[2], today)).toBe(false);
  });
});

describe("workspace task filtering and sorting", () => {
  it("searches task, description, and project text and filters by project/status", () => {
    expect(
      filterAndSortTasks(tasks, {
        search: "check details",
        status: "all",
        priority: "all",
        projectId: "",
        sort: "title",
      }).map((task) => task.id),
    ).toEqual(["task-b"]);
    expect(
      filterAndSortTasks(tasks, {
        search: "",
        status: "todo",
        priority: "all",
        projectId: project.id,
        sort: "due_date",
      }),
    ).toEqual([]);
  });

  it("sorts by priority and due date with undated tasks last", () => {
    expect(
      filterAndSortTasks(tasks, {
        search: "",
        status: "all",
        priority: "all",
        projectId: "",
        sort: "priority",
      }).map((task) => task.id),
    ).toEqual(["task-a", "task-c", "task-b"]);
    expect(
      filterAndSortTasks(tasks, {
        search: "",
        status: "all",
        priority: "all",
        projectId: "",
        sort: "due_date",
      }).map((task) => task.id),
    ).toEqual(["task-b", "task-a", "task-c"]);
  });

  it("filters tasks by priority", () => {
    expect(
      filterAndSortTasks(tasks, {
        search: "",
        status: "all",
        priority: "high",
        projectId: "",
        sort: "due_date",
      }).map((task) => task.id),
    ).toEqual(["task-a"]);
  });

  it("sorts statuses in workflow order", () => {
    expect(
      filterAndSortTasks(tasks, {
        search: "",
        status: "all",
        priority: "all",
        projectId: "",
        sort: "status",
      }).map((task) => task.status),
    ).toEqual(["todo", "in_progress", "done"]);
  });
});

describe("project progress", () => {
  it("calculates completed work as a percentage of project tasks", () => {
    expect(getProjectProgress(tasks, project.id)).toEqual({
      total: 2,
      completed: 1,
      percentage: 50,
    });
    expect(getProjectProgress([], project.id)).toEqual({
      total: 0,
      completed: 0,
      percentage: 0,
    });
  });
});
