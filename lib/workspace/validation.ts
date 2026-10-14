import { z } from "zod";
import { taskPriorities, taskStatuses } from "./types";

const projectIdSchema = z.string().uuid("Choose a valid project.");
const recordIdSchema = z.string().uuid("This item could not be found.");

const optionalDescriptionSchema = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum, `Use no more than ${maximum} characters.`)
    .transform((value) => value || null);

const projectFields = {
  name: z
    .string()
    .trim()
    .min(1, "Enter a project name.")
    .max(120, "Project names must be 120 characters or fewer."),
  description: optionalDescriptionSchema(2000),
};

export const createProjectSchema = z.object(projectFields).strict();
export const updateProjectSchema = z
  .object({
    id: recordIdSchema,
    ...projectFields,
  })
  .strict();

const taskFields = {
  projectId: projectIdSchema,
  title: z
    .string()
    .trim()
    .min(1, "Enter a task title.")
    .max(200, "Task titles must be 200 characters or fewer."),
  description: optionalDescriptionSchema(5000),
  status: z.enum(taskStatuses, { error: "Choose a valid task status." }),
  priority: z.enum(taskPriorities, { error: "Choose a valid task priority." }),
  dueDate: z
    .string()
    .trim()
    .transform((value) => value || null)
    .refine(
      (value) => value === null || z.iso.date().safeParse(value).success,
      "Enter a valid due date.",
    ),
};

export const createTaskSchema = z.object(taskFields).strict();
export const updateTaskSchema = z
  .object({
    id: recordIdSchema,
    ...taskFields,
  })
  .strict();

export const deleteRecordSchema = z
  .object({ id: recordIdSchema })
  .strict();

export type ProjectFormValues = z.output<typeof createProjectSchema>;
export type TaskFormValues = z.output<typeof createTaskSchema>;

export type WorkspaceFieldErrors = Partial<
  Record<
    "name" | "description" | "title" | "projectId" | "status" | "priority" | "dueDate",
    string
  >
>;

export type WorkspaceActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: WorkspaceFieldErrors;
};

export const initialWorkspaceActionState: WorkspaceActionState = {
  status: "idle",
  message: "",
};
