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
  const [notice, setNotice] = useState<string | null>(() =>
    signOutError ? "We couldn't sign you out. Please try again." : null,
  );
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
    if (successMessage) setNotice(successMessage);
  }, []);

  useEffect(() => {
    if (activeDialog) return;
    dialogTriggerRef.current?.focus();
    dialogTriggerRef.current = null;
  }, [activeDialog]);

  useEffect(() => {
    if (signOutError) {
      setNotice("We couldn't sign you out. Please try again.");
    }
  }, [signOutError]);

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
      ? "Good morning"
      : today.getHours() < 18
        ? "Good afternoon"
        : "Good evening";
  const formattedToday = today.toLocaleDateString("en-US", {
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
          {notice && (
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
                aria-label="Dismiss notification"
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
                Workspace unavailable
              </h1>
              <p className="mt-1 text-sm text-rose-800">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100"
              >
                Try again
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
                    {greeting}, welcome back
                    <span className="text-teal-600">.</span>
                  </h1>
                  <p className="mt-2 text-[15px] text-slate-500">
                    Here&apos;s what&apos;s happening across your workspace.
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
                    New project
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
                        ? "Create a project before adding a task."
                        : undefined
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={16} aria-hidden="true" />
                    New task
                  </button>
                </div>
              </div>

              <section
                aria-label="Workspace data"
                className="mb-7 flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3.5 sm:items-center"
              >
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm sm:mt-0">
                  <Sparkles size={16} aria-hidden="true" />
                </span>
                <p className="text-sm leading-6 text-teal-950">
                  <span className="font-semibold">Your saved workspace</span>
                  <span className="text-teal-800">
                    {" "}
                    — Projects and tasks are stored in your account. Access is
                    limited to projects you own.
                  </span>
                </p>
              </section>

              <section aria-labelledby="overview-heading" className="mb-9">
                <div className="mb-4 flex items-center justify-between">
                  <h2
                    id="overview-heading"
                    className="text-base font-semibold text-slate-900"
                  >
                    Overview
                  </h2>
                  <span className="text-xs font-medium text-slate-400">
                    LIVE DATA
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <SummaryCard
                    label="Total tasks"
                    value={summary.total}
                    description="Across your projects"
                    icon={ListTodo}
                    iconClass="bg-blue-50 text-blue-700"
                  />
                  <SummaryCard
                    label="Completed"
                    value={summary.completed}
                    description="Tasks marked as done"
                    icon={Check}
                    iconClass="bg-emerald-50 text-emerald-700"
                  />
                  <SummaryCard
                    label="Overdue"
                    value={summary.overdue}
                    description="Unfinished and past due"
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
                      Your projects
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {projects.length} {projects.length === 1 ? "project" : "projects"} in your workspace.
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
                    Add project
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
                      Start with a project
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Create a project to organize and add tasks.
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
                      Create your first project
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
                                ? "task"
                                : "tasks"}
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
                                  {progress.completed} of {progress.total}{" "}
                                  complete
                                </span>
                                <span>{progress.percentage}%</span>
                              </div>
                              <div
                                role="progressbar"
                                aria-label={`${project.name} progress`}
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
                            No tasks yet
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
                            Edit
                          </button>
                          <DeleteRecordButton
                            id={project.id}
                            label="Delete"
                            ariaLabel={`Delete project ${project.name}`}
                            confirmMessage={`Delete “${project.name}” and all of its tasks? This cannot be undone.`}
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
                      Your tasks
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {summary.total}
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Search, filter, and organize tasks across your projects.
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
                    Add task
                  </button>
                </div>

                <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_150px_180px_150px_auto]">
                  <label className="relative block">
                    <span className="sr-only">Search tasks</span>
                    <Search
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search tasks or projects"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                    />
                  </label>
                  <label>
                    <span className="sr-only">Filter by priority</span>
                    <select
                      aria-label="Filter by priority"
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
                      <option value="all">All priorities</option>
                      <option value="high">High priority</option>
                      <option value="medium">Medium priority</option>
                      <option value="low">Low priority</option>
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Filter by status</span>
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
                      <option value="all">All statuses</option>
                      <option value="todo">To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Filter by project</span>
                    <select
                      value={projectId}
                      onChange={(event) => setProjectId(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                    >
                      <option value="">All projects</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Sort tasks</span>
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
                      <option value="due_date">Sort: due date</option>
                      <option value="title">Sort: title</option>
                      <option value="priority">Sort: priority</option>
                      <option value="status">Sort: status</option>
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
                      Clear filters
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
