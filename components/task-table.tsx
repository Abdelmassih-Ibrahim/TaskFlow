import { Check, Circle, CircleDashed, Pencil } from "lucide-react";
import {
  formatDueDate,
  isWorkspaceTaskOverdue,
} from "@/lib/workspace/dashboard";
import { deleteTask } from "@/app/actions/workspace";
import type { TaskWithProject } from "@/lib/workspace/types";
import { DeleteRecordButton } from "./workspace-dialogs";

const statusStyles = {
  todo: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-50 text-blue-700",
  done: "bg-emerald-50 text-emerald-700",
} as const;

const statusLabels = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
} as const;

const priorityStyles = {
  low: "text-slate-500",
  medium: "text-amber-700",
  high: "text-rose-700",
} as const;

function StatusIcon({ status }: { status: TaskWithProject["status"] }) {
  if (status === "done") return <Check size={13} aria-hidden="true" />;
  if (status === "in_progress")
    return <CircleDashed size={13} aria-hidden="true" />;
  return <Circle size={13} aria-hidden="true" />;
}

function TaskActions({
  task,
  onEdit,
}: {
  task: TaskWithProject;
  onEdit: (task: TaskWithProject) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onEdit(task)}
        aria-label={`Edit ${task.title}`}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <Pencil size={15} aria-hidden="true" />
      </button>
      <DeleteRecordButton
        id={task.id}
        label="Delete"
        confirmMessage={`Delete “${task.title}”? This cannot be undone.`}
        action={deleteTask}
      />
    </div>
  );
}

export function TaskTable({
  tasks,
  totalTasks,
  today = new Date(),
  onEditTask,
}: {
  tasks: TaskWithProject[];
  totalTasks: number;
  today?: Date;
  onEditTask: (task: TaskWithProject) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
        <h3 className="text-sm font-semibold text-slate-800">
          {totalTasks === 0 ? "No tasks yet" : "No tasks match these filters"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {totalTasks === 0
            ? "Create a task to add the first piece of work to your projects."
            : "Try changing the search or filters."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <th scope="col" className="w-[31%] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Task</th>
              <th scope="col" className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Project</th>
              <th scope="col" className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Due date</th>
              <th scope="col" className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Priority</th>
              <th scope="col" className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Status</th>
              <th scope="col" className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const overdue = isWorkspaceTaskOverdue(task, today);
              return (
                <tr key={task.id} className="transition-colors hover:bg-slate-50/70">
                  <th scope="row" className="px-5 py-3.5 text-left">
                    <div className="flex items-center gap-2.5">
                      <span className={`shrink-0 ${task.status === "done" ? "text-emerald-600" : task.status === "in_progress" ? "text-blue-600" : "text-slate-300"}`}>
                        <StatusIcon status={task.status} />
                      </span>
                      <span className={`text-[13px] font-medium ${task.status === "done" ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800"}`}>
                        {task.title}
                      </span>
                    </div>
                    {task.description && (
                      <p className="ml-6 mt-1 line-clamp-1 text-xs font-normal text-slate-400">
                        {task.description}
                      </p>
                    )}
                  </th>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{task.project.name}</td>
                  <td className={`px-4 py-3.5 text-xs ${overdue ? "font-medium text-rose-600" : "text-slate-500"}`}>
                    {task.due_date ? formatDueDate(task.due_date, today) : "No due date"}
                    {overdue && <span className="ml-1.5 text-[10px] text-rose-400">overdue</span>}
                  </td>
                  <td className={`px-4 py-3.5 text-xs font-medium ${priorityStyles[task.priority]}`}>
                    <span className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${task.priority === "high" ? "bg-rose-500" : task.priority === "medium" ? "bg-amber-500" : "bg-slate-300"}`} />
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold ${statusStyles[task.status]}`}>
                      {statusLabels[task.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <TaskActions task={task} onEdit={onEditTask} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 md:hidden">
        {tasks.map((task) => {
          const overdue = isWorkspaceTaskOverdue(task, today);
          return (
            <li key={task.id} className="space-y-3 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className={`mt-0.5 shrink-0 ${task.status === "done" ? "text-emerald-600" : task.status === "in_progress" ? "text-blue-600" : "text-slate-300"}`}>
                    <StatusIcon status={task.status} />
                  </span>
                  <div className="min-w-0">
                    <p className={`break-words text-sm font-medium ${task.status === "done" ? "text-slate-400 line-through" : "text-slate-800"}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>
                    )}
                  </div>
                </div>
                <TaskActions task={task} onEdit={onEditTask} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="max-w-full truncate rounded bg-slate-50 px-2 py-1">{task.project.name}</span>
                <span className={`rounded px-2 py-1 ${statusStyles[task.status]}`}>{statusLabels[task.status]}</span>
                <span className={`rounded bg-slate-50 px-2 py-1 ${priorityStyles[task.priority]}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
                </span>
                <span className={overdue ? "font-medium text-rose-600" : ""}>
                  {task.due_date ? formatDueDate(task.due_date, today) : "No due date"}
                  {overdue ? " · overdue" : ""}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-400">
          Showing {tasks.length} of {totalTasks} tasks
        </p>
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          Saved workspace
        </span>
      </div>
    </div>
  );
}
