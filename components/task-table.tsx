import { Check, Circle, CircleDashed } from "lucide-react";
import {
  formatDueDate,
  type DemoTask,
  type TaskPriority,
  type TaskStatus,
  isTaskOverdue,
} from "@/lib/demo-tasks";

const statusStyles: Record<TaskStatus, string> = {
  "To do": "bg-slate-100 text-slate-600",
  "In progress": "bg-blue-50 text-blue-700",
  Done: "bg-emerald-50 text-emerald-700",
};

const priorityStyles: Record<TaskPriority, string> = {
  Low: "text-slate-500",
  Medium: "text-amber-700",
  High: "text-rose-700",
};

const avatarColors = [
  "bg-amber-100 text-amber-800",
  "bg-indigo-100 text-indigo-800",
  "bg-emerald-100 text-emerald-800",
  "bg-pink-100 text-pink-800",
];

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === "Done") {
    return <Check size={13} aria-hidden="true" />;
  }

  if (status === "In progress") {
    return <CircleDashed size={13} aria-hidden="true" />;
  }

  return <Circle size={13} aria-hidden="true" />;
}

export function TaskTable({
  tasks,
  today = new Date(),
}: {
  tasks: DemoTask[];
  today?: Date;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <th scope="col" className="w-[35%] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Task
              </th>
              <th scope="col" className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Project
              </th>
              <th scope="col" className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Due date
              </th>
              <th scope="col" className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Priority
              </th>
              <th scope="col" className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Team
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const overdue = isTaskOverdue(task, today);

              return (
                <tr key={task.id} className="transition-colors hover:bg-slate-50/70">
                  <th scope="row" className="px-5 py-3.5 text-left">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`shrink-0 ${
                          task.status === "Done"
                            ? "text-emerald-600"
                            : task.status === "In progress"
                              ? "text-blue-600"
                              : "text-slate-300"
                        }`}
                      >
                        <StatusIcon status={task.status} />
                      </span>
                      <span
                        className={`text-[13px] font-medium ${
                          task.status === "Done"
                            ? "text-slate-400 line-through decoration-slate-300"
                            : "text-slate-800"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  </th>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{task.project}</td>
                  <td
                    className={`px-4 py-3.5 text-xs ${
                      overdue ? "font-medium text-rose-600" : "text-slate-500"
                    }`}
                  >
                    {formatDueDate(task.dueDate, today)}
                    {overdue && (
                      <span className="ml-1.5 text-[10px] text-rose-400">
                        overdue
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-3.5 text-xs font-medium ${priorityStyles[task.priority]}`}>
                    <span
                      className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${
                        task.priority === "High"
                          ? "bg-rose-500"
                          : task.priority === "Medium"
                            ? "bg-amber-500"
                            : "bg-slate-300"
                      }`}
                    />
                    {task.priority}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold ${statusStyles[task.status]}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div
                      role="group"
                      aria-label={`Assigned to ${task.assignees.join(", ")}`}
                      className="flex -space-x-1.5"
                    >
                      {task.assignees.map((assignee, index) => (
                        <span
                          key={assignee}
                          aria-hidden="true"
                          className={`flex size-6 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold ${
                            avatarColors[index % avatarColors.length]
                          }`}
                        >
                          {assignee}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-400">
          Showing {tasks.length} sample tasks
        </p>
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          Demo data only
        </span>
      </div>
    </div>
  );
}
