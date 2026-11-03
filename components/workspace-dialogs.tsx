"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  addComment,
  deleteComment,
  loadTaskHistory,
  type TaskHistory,
} from "@/app/actions/comments";
import {
  createProject,
  createSprint,
  createTask,
  updateProject,
  updateTask,
} from "@/app/actions/workspace";
import type {
  Project,
  ProjectMember,
  Sprint,
  TaskWithProject,
} from "@/lib/workspace/types";
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
      className="m-auto w-[min(640px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
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
          : "border-indigo-200 bg-indigo-50 text-indigo-900"
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
  "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20";
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
        onClick={() => onClose()}
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
              Beskrivning <span className="font-normal text-slate-500">Valfritt</span>
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
  members,
  sprints,
  onClose,
}: {
  task: TaskWithProject | null;
  projects: Project[];
  members: ProjectMember[];
  sprints: Sprint[];
  onClose: (successMessage?: string) => void;
}) {
  const action = task ? updateTask : createTask;
  const [state, formAction, pending] = useActionState(
    action,
    initialWorkspaceActionState,
  );
  const [projectId, setProjectId] = useState(task?.project_id ?? projects[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? "");
  const [sprintId, setSprintId] = useState(task?.sprint_id ?? "");

  useEffect(() => {
    if (state.status === "success") onClose(state.message);
  }, [onClose, state.message, state.status]);

  const errors: WorkspaceFieldErrors = state.fieldErrors ?? {};
  const projectMembers = members.filter((member) => member.project_id === projectId);
  const projectSprints = sprints.filter((sprint) => sprint.project_id === projectId);

  const changeProject = (nextProjectId: string) => {
    setProjectId(nextProjectId);
    if (!members.some((member) => member.project_id === nextProjectId && member.user_id === assigneeId)) {
      setAssigneeId("");
    }
    setSprintId("");
  };

  return (
    <WorkspaceDialog
      title={task ? "Redigera uppgift" : "Skapa en uppgift"}
      description="Fyll i uppgiften, välj ansvarig och projekt."
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
              Beskrivning <span className="font-normal text-slate-500">Valfritt</span>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-project" className={labelClassName}>
                Projekt
              </label>
              <select
                id="task-project"
                name="projectId"
                required
                value={projectId}
                onChange={(event) => changeProject(event.target.value)}
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
            <div>
              <label htmlFor="task-assignee" className={labelClassName}>
                Ansvarig
              </label>
              <select
                id="task-assignee"
                name="assigneeId"
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                aria-invalid={Boolean(errors.assigneeId)}
                aria-describedby={errors.assigneeId ? "task-assignee-error" : undefined}
                className={inputClassName}
              >
                <option value="">Ingen</option>
                {projectMembers.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user_email ?? "Okänd e-post"}
                  </option>
                ))}
              </select>
              <FieldError id="task-assignee-error" message={errors.assigneeId} />
            </div>
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
              <FieldError id="task-due-date-error" message={errors.dueDate} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-sprint" className={labelClassName}>
                Sprint
              </label>
              <select
                id="task-sprint"
                name="sprintId"
                value={sprintId}
                onChange={(event) => setSprintId(event.target.value)}
                aria-invalid={Boolean(errors.sprintId)}
                aria-describedby={errors.sprintId ? "task-sprint-error" : undefined}
                className={inputClassName}
              >
                <option value="">Backlogg (ingen sprint)</option>
                {projectSprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
              <FieldError id="task-sprint-error" message={errors.sprintId} />
            </div>
            <div>
              <label htmlFor="task-labels" className={labelClassName}>
                Etiketter <span className="font-normal text-slate-500">Kommaseparerade</span>
              </label>
              <input
                id="task-labels"
                name="labels"
                type="text"
                placeholder="backend, bugg"
                defaultValue={task?.labels.join(", ") ?? ""}
                aria-invalid={Boolean(errors.labels)}
                aria-describedby={errors.labels ? "task-labels-error" : undefined}
                className={inputClassName}
              />
              <FieldError id="task-labels-error" message={errors.labels} />
            </div>
          </div>
        </div>
        <DialogActions
          pending={pending}
          submitLabel={task ? "Spara ändringar" : "Skapa uppgift"}
          onClose={onClose}
        />
      </form>
      {task && <TaskHistoryPanel taskId={task.id} members={members} />}
    </WorkspaceDialog>
  );
}

function formatActivityDate(value: string): string {
  return new Date(value).toLocaleString("sv-SE", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function TaskHistoryPanel({
  taskId,
  members,
}: {
  taskId: string;
  members: ProjectMember[];
}) {
  const [history, setHistory] = useState<TaskHistory | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [commentState, commentAction, commentPending] = useActionState(
    addComment,
    initialWorkspaceActionState,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteComment,
    initialWorkspaceActionState,
  );

  useEffect(() => {
    let cancelled = false;
    loadTaskHistory(taskId).then((result) => {
      if (cancelled) return;
      setHistory(result);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId, commentState, deleteState]);

  const emailFor = (userId: string | null) =>
    members.find((member) => member.user_id === userId)?.user_email ?? "Okänd användare";

  return (
    <section aria-labelledby="task-history-heading" className="space-y-5 border-t border-slate-100 px-5 py-5 sm:px-6">
      <h3 id="task-history-heading" className="text-sm font-semibold text-slate-900">
        Kommentarer
      </h3>

      {!loaded && <p className="text-sm text-slate-500">Laddar...</p>}
      {loaded && !history && (
        <p className="text-sm text-slate-500">Historiken kunde inte läsas in.</p>
      )}

      {history && (
        <ul className="space-y-3">
          {history.comments.length === 0 && (
            <li className="text-sm text-slate-500">Inga kommentarer ännu.</li>
          )}
          {history.comments.map((comment) => (
            <li key={comment.id} className="rounded-lg bg-slate-50 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{emailFor(comment.author_id)}</span>
                <span>{formatActivityDate(comment.created_at)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{comment.body}</p>
              <form action={deleteAction} className="mt-1 text-right">
                <input type="hidden" name="id" value={comment.id} />
                <button type="submit" className="text-xs font-medium text-slate-500 hover:text-rose-700">
                  Ta bort
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={commentAction} className="space-y-2">
        <input type="hidden" name="taskId" value={taskId} />
        <label htmlFor="task-comment" className={labelClassName}>
          Ny kommentar
        </label>
        <textarea
          id="task-comment"
          name="body"
          rows={2}
          maxLength={2000}
          required
          className={inputClassName}
        />
        <Feedback state={commentState} />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={commentPending}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {commentPending ? "Skickar..." : "Kommentera"}
          </button>
        </div>
      </form>

      {history && history.activity.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Aktivitet</h3>
          <ul className="mt-2 space-y-1.5">
            {history.activity.map((entry) => (
              <li key={entry.id} className="text-xs text-slate-600">
                <span className="font-medium text-slate-800">{emailFor(entry.actor_id)}</span>{" "}
                {entry.message} · {formatActivityDate(entry.created_at)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function SprintDialog({
  projects,
  onClose,
}: {
  projects: Project[];
  onClose: (successMessage?: string) => void;
}) {
  const [state, formAction, pending] = useActionState(
    createSprint,
    initialWorkspaceActionState,
  );

  useEffect(() => {
    if (state.status === "success") onClose(state.message);
  }, [onClose, state.message, state.status]);

  const errors: WorkspaceFieldErrors = state.fieldErrors ?? {};

  return (
    <WorkspaceDialog
      title="Ny sprint"
      description="Sprintar grupperar uppgifter under en tidsperiod."
      busy={pending}
      onClose={onClose}
    >
      <form action={formAction} aria-busy={pending}>
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <Feedback state={state} />
          <div>
            <label htmlFor="sprint-project" className={labelClassName}>
              Projekt
            </label>
            <select id="sprint-project" name="projectId" required className={inputClassName}>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sprint-name" className={labelClassName}>
              Sprintnamn
            </label>
            <input
              id="sprint-name"
              name="name"
              type="text"
              required
              maxLength={80}
              aria-invalid={Boolean(errors.name)}
              className={inputClassName}
            />
            <FieldError id="sprint-name-error" message={errors.name} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sprint-start" className={labelClassName}>
                Startdatum
              </label>
              <input id="sprint-start" name="startsOn" type="date" className={inputClassName} />
            </div>
            <div>
              <label htmlFor="sprint-end" className={labelClassName}>
                Slutdatum
              </label>
              <input
                id="sprint-end"
                name="endsOn"
                type="date"
                aria-invalid={Boolean(errors.endsOn)}
                className={inputClassName}
              />
              <FieldError id="sprint-end-error" message={errors.endsOn} />
            </div>
          </div>
        </div>
        <DialogActions
          pending={pending}
          submitLabel="Skapa sprint"
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
            state.status === "error" ? "text-rose-700" : "text-indigo-800"
          }`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
