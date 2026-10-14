import { z } from "zod";
import { taskPriorities, taskStatuses } from "./types";

const projectIdSchema = z.string().uuid("Välj ett giltigt projekt.");
const recordIdSchema = z.string().uuid("Det gick inte att hitta objektet.");

const optionalDescriptionSchema = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum, `Använd högst ${maximum} tecken.`)
    .transform((value) => value || null);

const projectFields = {
  name: z
    .string()
    .trim()
    .min(1, "Ange ett projektnamn.")
    .max(120, "Projektnamnet får innehålla högst 120 tecken."),
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
    .min(1, "Ange en uppgiftstitel.")
    .max(200, "Uppgiftstiteln får innehålla högst 200 tecken."),
  description: optionalDescriptionSchema(5000),
  status: z.enum(taskStatuses, { error: "Välj en giltig uppgiftsstatus." }),
  priority: z.enum(taskPriorities, { error: "Välj en giltig prioritet." }),
  dueDate: z
    .string()
    .trim()
    .transform((value) => value || null)
    .refine(
      (value) => value === null || z.iso.date().safeParse(value).success,
      "Ange ett giltigt förfallodatum.",
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
