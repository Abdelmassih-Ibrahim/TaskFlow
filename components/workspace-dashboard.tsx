"use client";

import {
  Check,
  FolderKanban,
  ListTodo,
  Plus,
  Search,
  Sparkles,
  Clock3,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteProject } from "@/app/actions/workspace";
import { SummaryCard } from "@/components/summary-card";
import { TaskTable } from "@/components/task-table";
import {
  filterAndSortTasks,
  getProjectProgress,
  getWorkspaceSummary,
} from "@/lib/workspace/dashboard";
import type {
  Project,
  TaskPriority,
  TaskStatus,
  TaskWithProject,
  WorkspaceData,
} from "@/lib/workspace/types";
import { taskPriorities, taskStatuses } from "@/lib/workspace/types";
import {
  DeleteRecordButton,
  ProjectDialog,
  TaskDialog,
} from "@/components/workspace-dialogs";

type ActiveDialog =
  | { type: "project"; project: Project | null }
  | { type: "task"; task: TaskWithProject | null }
  | null;

function SignOutFailureNotice() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
    >
      <span>Det gick inte att logga ut. Försök igen.</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Stäng meddelandet om utloggningsfel"
        className="rounded p-1 text-rose-800 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

const taskSortOptions = ["due_date", "title", "priority", "status"] as const;
type TaskSort = (typeof taskSortOptions)[number];

export function WorkspaceDashboard({
  projects,
  tasks,
  error,
  signOutError = false,
}: WorkspaceData & { signOutError?: boolean }) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [priority, setPriority] = useState<TaskPriority | "all">("all");
  const [projectId, setProjectId] = useState("");
  const [sort, setSort] = useState<TaskSort>("due_date");
  const [notice, setNotice] = useState<string | null>(null);
  const dialogTriggerRef = useRef<HTMLElement | null>(null);
  const openDialog = useCallback(
    (dialog: Exclude<ActiveDialog, null>, trigger: HTMLElement) => {
      dialogTriggerRef.current = trigger;
      setActiveDialog(dialog);
    },
    [],
  );
  const closeDialog = useCallback((successMessage?: string) => {
    setActiveDialog(null);
    if (typeof successMessage === "string" && successMessage) {
      setNotice(successMessage);
    }
  }, []);

  useEffect(() => {
    if (activeDialog) return;
    dialogTriggerRef.current?.focus();
    dialogTriggerRef.current = null;
  }, [activeDialog]);

  const summary = useMemo(() => getWorkspaceSummary(tasks), [tasks]);
  const filteredTasks = useMemo(
    () =>
      filterAndSortTasks(tasks, {
        search,
        status,
        priority,
        projectId,
        sort,
      }),
    [priority, projectId, search, sort, status, tasks],
  );
  const progressByProject = useMemo(
    () =>
      new Map(
        projects.map((project) => [
          project.id,
          getProjectProgress(tasks, project.id),
        ]),
      ),
    [projects, tasks],
  );
  const hasFilters = Boolean(
    search || projectId || status !== "all" || priority !== "all",
  );

  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? "God morgon"
      : today.getHours() < 18
        ? "God eftermiddag"
        : "God kväll";
  const formattedToday = today.toLocaleDateString("sv-SE", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <main
        id="dashboard"
        className="min-w-0 flex-1 px-5 pb-12 pt-7 sm:px-8 lg:ml-[248px] lg:px-10 lg:pt-10"
      >
        <div className="mx-auto max-w-[1320px]">
          {signOutError && <SignOutFailureNotice />}
          {!signOutError && notice && (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900"
            >
              <span className="inline-flex items-center gap-2">
                <Check size={16} aria-hidden="true" />
                {notice}
              </span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Stäng meddelandet"
                className="rounded p-1 text-teal-800 hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}
          {error ? (
            <section
              role="alert"
              className="mb-7 rounded-xl border border-rose-200 bg-rose-50 p-5"
            >
              <h1 className="text-lg font-semibold text-rose-900">
                Arbetsytan är inte tillgänglig
              </h1>
              <p className="mt-1 text-sm text-rose-800">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100"
              >
                Försök igen
              </button>
            </section>
          ) : (
            <>
              <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-500">
                    {formattedToday}
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[34px]">
                    {greeting}, välkommen tillbaka
                    <span className="text-teal-600">.</span>
                  </h1>
                  <p className="mt-2 text-[15px] text-slate-500">
                    Här är en översikt över din arbetsyta.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(event) =>
                      openDialog(
                        { type: "project", project: null },
                        event.currentTarget,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <FolderKanban size={16} aria-hidden="true" />
                    Nytt projekt
                  </button>
                  <button
                    type="button"
                    onClick={(event) =>
                      openDialog(
                        { type: "task", task: null },
                        event.currentTarget,
                      )
                    }
                    disabled={projects.length === 0}
                    title={
                      projects.length === 0
                        ? "Skapa ett projekt innan du lägger till en uppgift."
                        : undefined
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={16} aria-hidden="true" />
                    Ny uppgift
                  </button>
                </div>
              </div>

              <section
                aria-label="Data för arbetsytan"
                className="mb-7 flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3.5 sm:items-center"
              >
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm sm:mt-0">
                  <Sparkles size={16} aria-hidden="true" />
                </span>
                <p className="text-sm leading-6 text-teal-950">
                  <span className="font-semibold">Din sparade arbetsyta</span>
                  <span className="text-teal-800">
                    {" "}
                    — Projekt och uppgifter lagras på ditt konto. Du har endast
                    åtkomst till projekt som du äger.
                  </span>
                </p>
              </section>

              <section aria-labelledby="overview-heading" className="mb-9">
                <div className="mb-4 flex items-center justify-between">
                  <h2
                    id="overview-heading"
                    className="text-base font-semibold text-slate-900"
                  >
                    Översikt
                  </h2>
                  <span className="text-xs font-medium text-slate-400">
                    SPARADE DATA
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <SummaryCard
                    label="Totalt antal uppgifter"
                    value={summary.total}
                    description="I alla dina projekt"
                    icon={ListTodo}
                    iconClass="bg-blue-50 text-blue-700"
                  />
                  <SummaryCard
                    label="Slutförda"
                    value={summary.completed}
                    description="Uppgifter markerade som klara"
                    icon={Check}
                    iconClass="bg-emerald-50 text-emerald-700"
                  />
                  <SummaryCard
                    label="Försenade"
                    value={summary.overdue}
                    description="Oavslutade med passerat datum"
                    icon={Clock3}
                    iconClass="bg-rose-50 text-rose-700"
                  />
                </div>
              </section>

              <section id="projects" aria-labelledby="projects-heading" className="mb-9">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2
                      id="projects-heading"
                      className="text-base font-semibold text-slate-900"
                    >
                      Dina projekt
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {projects.length} projekt i din arbetsyta.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) =>
                      openDialog(
                        { type: "project", project: null },
                        event.currentTarget,
                      )
                    }
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50"
                  >
                    <Plus size={16} aria-hidden="true" />
                    Lägg till projekt
                  </button>
                </div>
                {projects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                    <FolderKanban
                      size={23}
                      aria-hidden="true"
                      className="mx-auto text-slate-400"
                    />
                    <h3 className="mt-3 text-sm font-semibold text-slate-800">
                      Börja med ett projekt
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Skapa ett projekt för att organisera och lägga till uppgifter.
                    </p>
                    <button
                      type="button"
                      onClick={(event) =>
                        openDialog(
                          { type: "project", project: null },
                          event.currentTarget,
                        )
                      }
                      className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Skapa ditt första projekt
                    </button>
                  </div>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => {
                      const progress = progressByProject.get(project.id);
                      return (
                        <li
                          key={project.id}
                          className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                        >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words text-sm font-semibold text-slate-900">
                              {project.name}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {progress?.total ?? 0}{" "}
                              {progress?.total === 1
                                ? "uppgift"
                                : "uppgifter"}
                            </p>
                          </div>
                          <FolderKanban
                            size={17}
                            aria-hidden="true"
                            className="shrink-0 text-teal-700"
                          />
                        </div>
                        {progress?.total ? (
                            <div className="mt-4">
                              <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                                <span>
                                  {progress.completed} av {progress.total}{" "}
                                  klara
                                </span>
                                <span>{progress.percentage}%</span>
                              </div>
                              <div
                                role="progressbar"
                                aria-label={`Förlopp för ${project.name}`}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={progress.percentage}
                                className="h-1.5 overflow-hidden rounded-full bg-slate-100"
                              >
                                <div
                                  className="h-full rounded-full bg-teal-600 transition-[width] motion-reduce:transition-none"
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                            </div>
                        ) : (
                          <p className="mt-4 text-xs text-slate-500">
                            Inga uppgifter ännu
                          </p>
                        )}
                        {project.description && (
                          <p className="mt-3 line-clamp-2 break-words text-sm leading-5 text-slate-500">
                            {project.description}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2">
                          <button
                            type="button"
                            onClick={(event) =>
                              openDialog(
                                { type: "project", project },
                                event.currentTarget,
                              )
                            }
                            className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            Redigera
                          </button>
                          <DeleteRecordButton
                            id={project.id}
                            label="Ta bort"
                            ariaLabel={`Ta bort projektet ${project.name}`}
                            confirmMessage={`Ta bort ”${project.name}” och alla dess uppgifter? Åtgärden kan inte ångras.`}
                            action={deleteProject}
                          />
                        </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section id="task-overview" aria-labelledby="tasks-heading">
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <h2
                      id="tasks-heading"
                      className="text-base font-semibold text-slate-900"
                    >
                      Dina uppgifter
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {summary.total}
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Sök, filtrera och organisera uppgifter i dina projekt.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) =>
                      openDialog(
                        { type: "task", task: null },
                        event.currentTarget,
                      )
                    }
                    disabled={projects.length === 0}
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={15} aria-hidden="true" />
                    Lägg till uppgift
                  </button>
                </div>

                <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_150px_180px_150px_auto]">
                  <label className="relative block">
                    <span className="sr-only">Sök uppgifter</span>
                    <Search
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Sök uppgifter eller projekt"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                    />
                  </label>
                  <label>
                    <span className="sr-only">Filtrera efter prioritet</span>
                    <select
                      aria-label="Filtrera efter prioritet"
                      value={priority}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === "all") {
                          setPriority("all");
                          return;
                        }
                        const selectedPriority = taskPriorities.find(
                          (taskPriority) => taskPriority === value,
                        );
                        if (selectedPriority) setPriority(selectedPriority);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                    >
                      <option value="all">Alla prioriteter</option>
                      <option value="high">Hög</option>
                      <option value="medium">Medel</option>
                      <option value="low">Låg</option>
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Filtrera efter status</span>
                    <select
                      value={status}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === "all") {
                          setStatus("all");
                          return;
                        }
                        const selectedStatus = taskStatuses.find(
                          (taskStatus) => taskStatus === value,
                        );
                        if (selectedStatus) setStatus(selectedStatus);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                    >
                      <option value="all">Alla statusar</option>
                      <option value="todo">Att göra</option>
                      <option value="in_progress">Pågår</option>
                      <option value="done">Klar</option>
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Filtrera efter projekt</span>
                    <select
                      value={projectId}
                      onChange={(event) => setProjectId(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                    >
                      <option value="">Alla projekt</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Sortera uppgifter</span>
                    <select
                      value={sort}
                      onChange={(event) => {
                        const selectedSort = taskSortOptions.find(
                          (option) => option === event.target.value,
                        );
                        if (selectedSort) setSort(selectedSort);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                    >
                      <option value="due_date">Sortera: förfallodatum</option>
                      <option value="title">Sortera: titel</option>
                      <option value="priority">Sortera: prioritet</option>
                      <option value="status">Sortera: status</option>
                    </select>
                  </label>
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setStatus("all");
                        setPriority("all");
                        setProjectId("");
                      }}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Rensa filter
                    </button>
                  )}
                </div>
                <TaskTable
                  tasks={filteredTasks}
                  totalTasks={tasks.length}
                  onEditTask={(task) =>
                    openDialog(
                      { type: "task", task },
                      document.activeElement instanceof HTMLElement
                        ? document.activeElement
                        : document.body,
                    )
                  }
                />
              </section>
            </>
          )}
        </div>
      </main>

      {activeDialog?.type === "project" && (
        <ProjectDialog
          key={activeDialog.project?.id ?? "new-project"}
          project={activeDialog.project}
          onClose={closeDialog}
        />
      )}
      {activeDialog?.type === "task" && (
        <TaskDialog
          key={activeDialog.task?.id ?? "new-task"}
          task={activeDialog.task}
          projects={projects}
          onClose={closeDialog}
        />
      )}
    </>
  );
}
