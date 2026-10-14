import {
  CalendarDays,
  Check,
  CircleDashed,
  Clock3,
  ListTodo,
  Plus,
  Sparkles,
} from "lucide-react";
import { SummaryCard } from "@/components/summary-card";
import { TaskTable } from "@/components/task-table";
import { getDemoTasks, getTaskSummary } from "@/lib/demo-tasks";

export default function DashboardPage() {
  const today = new Date();
  const tasks = getDemoTasks(today);
  const summary = getTaskSummary(tasks, today);
  const firstName = "Alex";
  const formattedToday = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main id="dashboard" className="min-w-0 flex-1 px-5 pb-12 pt-7 sm:px-8 lg:px-10 lg:pt-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-500">
              {formattedToday}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[34px]">
              Good morning, {firstName}
              <span className="text-teal-600">.</span>
            </h1>
            <p className="mt-2 text-[15px] text-slate-500">
              Here&apos;s what&apos;s happening across your workspace.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
            <CalendarDays size={16} aria-hidden="true" className="text-slate-400" />
            This week
          </div>
        </div>

        <section
          aria-label="Demo data notice"
          className="mb-7 flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3.5 sm:items-center"
        >
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm sm:mt-0">
            <Sparkles size={16} aria-hidden="true" />
          </span>
          <p className="text-sm leading-6 text-teal-950">
            <span className="font-semibold">Demo workspace</span>
            <span className="text-teal-800">
              {" "}
              — This dashboard uses sample tasks. Nothing is saved, and
              sign-in and task editing are not available yet.
            </span>
          </p>
        </section>

        <section aria-labelledby="overview-heading" className="mb-9">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="overview-heading" className="text-base font-semibold text-slate-900">
              Overview
            </h2>
            <span className="text-xs font-medium text-slate-400">DEMO DATA</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
              label="Total tasks"
              value={summary.total}
              description="Across all demo projects"
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

        <section id="task-overview" aria-labelledby="tasks-heading">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 id="tasks-heading" className="text-base font-semibold text-slate-900">
                  Your tasks
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {summary.total}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                A preview of work across your projects.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500">
              <CircleDashed size={15} aria-hidden="true" />
              Sample tasks only
            </span>
          </div>
          <TaskTable tasks={tasks} today={today} />
        </section>

        <section
          aria-label="Demo mode details"
          className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
              <Plus size={16} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-800">
                Ready to make this workspace yours?
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Project creation and task editing are planned for a future milestone.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            Coming later
            <ArrowUpRight size={13} aria-hidden="true" />
          </span>
        </section>
      </div>
    </main>
  );
}
