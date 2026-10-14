import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  createTaskSchema,
  updateTaskSchema,
} from "./validation";

const validProjectId = "a8f5a1ea-64c2-42fd-ae86-5d39cf9e5b05";
const validTaskId = "17cf2d6e-054c-4cf0-a2c6-d34c6a0d27ae";

describe("project input validation", () => {
  it("trims project names and normalizes empty descriptions", () => {
    expect(
      createProjectSchema.parse({
        name: "  Website refresh  ",
        description: "   ",
      }),
    ).toEqual({ name: "Website refresh", description: null });
  });

  it("rejects blank names and values beyond database constraints", () => {
    expect(
      createProjectSchema.safeParse({ name: " \t ", description: "" }).success,
    ).toBe(false);
    expect(
      createProjectSchema.safeParse({ name: "x".repeat(121), description: "" })
        .success,
    ).toBe(false);
  });
});

describe("task input validation", () => {
  it("validates enum values, dates, and normalizes optional fields", () => {
    expect(
      createTaskSchema.parse({
        projectId: validProjectId,
        title: "  Plan launch  ",
        description: "",
        status: "in_progress",
        priority: "high",
        dueDate: "",
      }),
    ).toEqual({
      projectId: validProjectId,
      title: "Plan launch",
      description: null,
      status: "in_progress",
      priority: "high",
      dueDate: null,
    });
    expect(
      createTaskSchema.safeParse({
        projectId: validProjectId,
        title: "Task",
        description: "",
        status: "blocked",
        priority: "urgent",
        dueDate: "2026-02-30",
      }).success,
    ).toBe(false);
  });

  it("requires valid identifiers and rejects unrecognized owner fields", () => {
    expect(
      updateTaskSchema.safeParse({
        id: validTaskId,
        projectId: validProjectId,
        title: "Task",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
        ownerId: "spoofed",
      }).success,
    ).toBe(false);
  });
});
