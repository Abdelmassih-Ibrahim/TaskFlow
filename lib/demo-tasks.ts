export type TaskStatus = "To do" | "In progress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";

export interface DemoTask {
  id: string;
  title: string;
  project: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: string[];
}

export interface TaskSummary {
  total: number;
  completed: number;
  overdue: number;
}

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dateWithOffset(days: number, today: Date): string {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function getDemoTasks(today = new Date()): DemoTask[] {
  return [
    {
      id: "task-1",
      title: "Finalize Q4 launch brief",
      project: "Website redesign",
      dueDate: dateWithOffset(-2, today),
      status: "In progress",
      priority: "High",
      assignees: ["AL", "MK"],
    },
    {
      id: "task-2",
      title: "Review onboarding flow",
      project: "Mobile app",
      dueDate: dateWithOffset(0, today),
      status: "To do",
      priority: "High",
      assignees: ["AL"],
    },
    {
      id: "task-3",
      title: "Share updated brand assets",
      project: "Brand refresh",
      dueDate: dateWithOffset(1, today),
      status: "In progress",
      priority: "Medium",
      assignees: ["JR", "AL"],
    },
    {
      id: "task-4",
      title: "Map customer interview notes",
      project: "Website redesign",
      dueDate: dateWithOffset(-1, today),
      status: "To do",
      priority: "Medium",
      assignees: ["MK"],
    },
    {
      id: "task-5",
      title: "Prepare sprint retrospective",
      project: "Mobile app",
      dueDate: dateWithOffset(3, today),
      status: "To do",
      priority: "Low",
      assignees: ["JR"],
    },
    {
      id: "task-6",
      title: "Approve homepage wireframes",
      project: "Website redesign",
      dueDate: dateWithOffset(-3, today),
      status: "Done",
      priority: "High",
      assignees: ["AL", "JR"],
    },
    {
      id: "task-7",
      title: "Write release notes",
      project: "Mobile app",
      dueDate: dateWithOffset(5, today),
      status: "Done",
      priority: "Low",
      assignees: ["MK"],
    },
    {
      id: "task-8",
      title: "Audit help center articles",
      project: "Customer experience",
      dueDate: dateWithOffset(-4, today),
      status: "Done",
      priority: "Medium",
      assignees: ["JR"],
    },
    {
      id: "task-9",
      title: "Confirm analytics events",
      project: "Mobile app",
      dueDate: dateWithOffset(2, today),
      status: "In progress",
      priority: "Medium",
      assignees: ["AL"],
    },
    {
      id: "task-10",
      title: "Collect stakeholder feedback",
      project: "Brand refresh",
      dueDate: dateWithOffset(4, today),
      status: "To do",
      priority: "Low",
      assignees: ["MK", "JR"],
    },
  ];
}

export function getTaskSummary(
  tasks: DemoTask[],
  today = new Date(),
): TaskSummary {
  const todayKey = dateKey(today);

  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === "Done").length,
    overdue: tasks.filter(
      (task) => task.status !== "Done" && task.dueDate < todayKey,
    ).length,
  };
}

export function isTaskOverdue(task: DemoTask, today = new Date()): boolean {
  return task.status !== "Done" && task.dueDate < dateKey(today);
}

export { formatDueDate } from "./date-utils";
