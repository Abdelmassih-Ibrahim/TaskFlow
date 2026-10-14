"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";
import {
  createProject,
  createTask,
  updateProject,
  updateTask,
} from "@/app/actions/workspace";
import type { Project, TaskWithProject } from "@/lib/workspace/types";
import {
  initialWorkspaceActionState,
  type WorkspaceActionState,
  type WorkspaceFieldErrors,
} from "@/lib/workspace/validation";

type DialogProps = {
  title: string;
  description: string;
  busy: boolean;
  onClose: (successMessage?: string) => void;
  children: React.ReactNode;
};

function WorkspaceDialog({
  title,
  description,
  busy,
  onClose,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="workspace-dialog-title"
      aria-describedby="workspace-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(560px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
    >
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 id="workspace-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p
          id="workspace-dialog-description"
          className="mt-1 text-sm text-slate-500"
        >
          {description}
        </p>
      </div>
      {children}
    </dialog>
  );
}

function Feedback({
  state,
}: {
  state: WorkspaceActionState;
}) {
  if (state.status === "idle") return null;
  const isError = state.status === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`rounded-lg border px-3 py-2 text-sm ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-teal-200 bg-teal-50 text-teal-900"
      }`}
    >
      {state.message}
    </p>
  );
}

function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  return message ? (
    <p id={id} className="mt-1 text-sm text-rose-700">
      {message}
    </p>
  ) : null;
}

const inputClassName =
  "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";
const labelClassName = "block text-sm font-medium text-slate-800";

function DialogActions({
  pending,
  submitLabel,
  onClose,
}: {
  pending: boolean;
  submitLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      <button
        type="button"
        onClick={onClose}
        disabled={pending}
        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Avbryt
      </button>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Sparar..." : submitLabel}
      </button>
    </div>
  );
}

export function ProjectDialog({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: (successMessage?: string) => void;
}) {
  const action = project ? updateProject : createProject;
  const [state, formAction, pending] = useActionState(
    action,
    initialWorkspaceActionState,
  );

  useEffect(() => {
    if (state.status === "success") onClose(state.message);
  }, [onClose, state.message, state.status]);

  const errors: WorkspaceFieldErrors = state.fieldErrors ?? {};

  return (
    <WorkspaceDialog
      title={project ? "Redigera projekt" : "Skapa ett projekt"}
      description="Samla relaterade uppgifter på ett och samma ställe."
      busy={pending}
      onClose={onClose}
    >
      <form action={formAction} aria-busy={pending}>
        {project && <input type="hidden" name="id" value={project.id} />}
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <Feedback state={state} />
          <div>
            <label htmlFor="project-name" className={labelClassName}>
              Projektnamn
            </label>
            <input
              id="project-name"
              name="name"
              type="text"
              required
              maxLength={120}
              defaultValue={project?.name ?? ""}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "project-name-error" : undefined}
              className={inputClassName}
            />
            <FieldError id="project-name-error" message={errors.name} />
          </div>
          <div>
            <label htmlFor="project-description" className={labelClassName}>
              Beskrivning <span className="font-normal text-slate-400">Valfritt</span>
            </label>
            <textarea
              id="project-description"
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={project?.description ?? ""}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "project-description-error" : undefined
              }
              className={inputClassName}
            />
            <FieldError
              id="project-description-error"
              message={errors.description}
            />
          </div>
        </div>
        <DialogActions
          pending={pending}
          submitLabel={project ? "Spara ändringar" : "Skapa projekt"}
          onClose={onClose}
        />
      </form>
    </WorkspaceDialog>
  );
}

export function TaskDialog({
  task,
  projects,
  onClose,
}: {
  task: TaskWithProject | null;
  projects: Project[];
  onClose: (successMessage?: string) => void;
}) {
  const action = task ? updateTask : createTask;
  const [state, formAction, pending] = useActionState(
    action,
    initialWorkspaceActionState,
  );

  useEffect(() => {
    if (state.status === "success") onClose(state.message);
  }, [onClose, state.message, state.status]);

  const errors: WorkspaceFieldErrors = state.fieldErrors ?? {};

  return (
    <WorkspaceDialog
      title={task ? "Redigera uppgift" : "Skapa en uppgift"}
      description="Fyll i uppgiften och välj vilket projekt den tillhör."
      busy={pending}
      onClose={onClose}
    >
      <form action={formAction} aria-busy={pending}>
        {task && <input type="hidden" name="id" value={task.id} />}
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <Feedback state={state} />
          <div>
            <label htmlFor="task-title" className={labelClassName}>
              Uppgiftstitel
            </label>
            <input
              id="task-title"
              name="title"
              type="text"
              required
              maxLength={200}
              defaultValue={task?.title ?? ""}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "task-title-error" : undefined}
              className={inputClassName}
            />
            <FieldError id="task-title-error" message={errors.title} />
          </div>
          <div>
            <label htmlFor="task-description" className={labelClassName}>
              Beskrivning <span className="font-normal text-slate-400">Valfritt</span>
            </label>
            <textarea
              id="task-description"
              name="description"
              rows={3}
              maxLength={5000}
              defaultValue={task?.description ?? ""}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "task-description-error" : undefined
              }
              className={inputClassName}
            />
            <FieldError
              id="task-description-error"
              message={errors.description}
            />
          </div>
          <div>
            <label htmlFor="task-project" className={labelClassName}>
              Projekt
            </label>
            <select
              id="task-project"
              name="projectId"
              required
              defaultValue={task?.project_id ?? projects[0]?.id ?? ""}
              aria-invalid={Boolean(errors.projectId)}
              aria-describedby={
                errors.projectId ? "task-project-error" : undefined
              }
              className={inputClassName}
            >
              {projects.map((projectOption) => (
                <option key={projectOption.id} value={projectOption.id}>
                  {projectOption.name}
                </option>
              ))}
            </select>
            <FieldError id="task-project-error" message={errors.projectId} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="task-status" className={labelClassName}>
                Status
              </label>
              <select
                id="task-status"
                name="status"
                defaultValue={task?.status ?? "todo"}
                aria-invalid={Boolean(errors.status)}
                aria-describedby={errors.status ? "task-status-error" : undefined}
                className={inputClassName}
              >
                <option value="todo">Att göra</option>
                <option value="in_progress">Pågår</option>
                <option value="done">Klar</option>
              </select>
              <FieldError id="task-status-error" message={errors.status} />
            </div>
            <div>
              <label htmlFor="task-priority" className={labelClassName}>
                Prioritet
              </label>
              <select
                id="task-priority"
                name="priority"
                defaultValue={task?.priority ?? "medium"}
                aria-invalid={Boolean(errors.priority)}
                aria-describedby={
                  errors.priority ? "task-priority-error" : undefined
                }
                className={inputClassName}
              >
                <option value="low">Låg</option>
                <option value="medium">Medel</option>
                <option value="high">Hög</option>
              </select>
              <FieldError id="task-priority-error" message={errors.priority} />
            </div>
            <div>
              <label htmlFor="task-due-date" className={labelClassName}>
                Förfallodatum
              </label>
              <input
                id="task-due-date"
                name="dueDate"
                type="date"
                defaultValue={task?.due_date ?? ""}
                aria-invalid={Boolean(errors.dueDate)}
                aria-describedby={
                  errors.dueDate ? "task-due-date-error" : undefined
                }
                className={inputClassName}
              />
            </div>
          </div>
          <FieldError id="task-due-date-error" message={errors.dueDate} />
        </div>
        <DialogActions
          pending={pending}
          submitLabel={task ? "Spara ändringar" : "Skapa uppgift"}
          onClose={onClose}
        />
      </form>
    </WorkspaceDialog>
  );
}

type DeleteAction = (
  state: WorkspaceActionState,
  formData: FormData,
) => Promise<WorkspaceActionState>;

export function DeleteRecordButton({
  id,
  label,
  ariaLabel,
  confirmMessage,
  action,
}: {
  id: string;
  label: string;
  ariaLabel: string;
  confirmMessage: string;
  action: DeleteAction;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialWorkspaceActionState,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        aria-label={ariaLabel}
        className="rounded-md px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
      >
        {pending ? "Tar bort..." : label}
      </button>
      {state.status !== "idle" && (
        <span
          role={state.status === "error" ? "alert" : "status"}
          className={`text-xs ${
            state.status === "error" ? "text-rose-700" : "text-teal-800"
          }`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
