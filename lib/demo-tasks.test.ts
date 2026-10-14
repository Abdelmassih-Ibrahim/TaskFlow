import { describe, expect, it } from "vitest";
import {
  formatDueDate,
  getDemoTasks,
  getTaskSummary,
  isTaskOverdue,
} from "./demo-tasks";

const today = new Date(2026, 9, 14);

describe("demo task summaries", () => {
  it("counts all tasks, completed tasks, and overdue unfinished tasks", () => {
    const tasks = getDemoTasks(today);

    expect(getTaskSummary(tasks, today)).toEqual({
      total: 10,
      completed: 3,
      overdue: 2,
    });
  });

  it("does not count tasks due today or completed overdue tasks as overdue", () => {
    const tasks = getDemoTasks(today);

    expect(isTaskOverdue(tasks[1], today)).toBe(false);
    expect(isTaskOverdue(tasks[5], today)).toBe(false);
    expect(getTaskSummary(tasks, today).overdue).toBe(2);
  });
});

describe("demo task due dates", () => {
  it("labels today's and tomorrow's due dates clearly", () => {
    expect(formatDueDate("2026-10-14", today)).toBe("Idag");
    expect(formatDueDate("2026-10-15", today)).toBe("Imorgon");
  });
});
