import { getWorkspaceData } from '@/lib/workspace/data';
import { CalendarContent } from '@/components/calendar-content';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const workspace = await getWorkspaceData();

  return <CalendarContent {...workspace} />;
}
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { TaskWithProject } from '@/lib/workspace/types';
import {
  getWeeksInMonth,
  formatMonthYear,
  getPreviousMonth,
  getNextMonth,
} from '@/lib/workspace/calendar';
import type { WorkspaceData } from '@/lib/workspace/types';

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-700 border border-slate-200',
  in_progress: 'bg-blue-100 text-blue-700 border border-blue-200',
  done: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

const PRIORITY_INDICATORS: Record<string, string> = {
  high: 'rounded-full w-2 h-2 bg-rose-500 inline-block',
  medium: 'rounded-full w-2 h-2 bg-amber-500 inline-block',
  low: 'rounded-full w-2 h-2 bg-slate-400 inline-block',
};

function TaskBadge({
  task,
  onEdit,
}: {
  task: TaskWithProject;
  onEdit: (task: TaskWithProject) => void;
}) {
  const statusColor = STATUS_COLORS[task.status] || STATUS_COLORS.todo;

  return (
    <button
      onClick={() => onEdit(task)}
      className={`w-full px-2 py-1 rounded text-xs truncate font-medium text-left transition-colors hover:shadow-sm ${statusColor}`}
      title={task.title}
    >
      <span className={PRIORITY_INDICATORS[task.priority] || PRIORITY_INDICATORS.low}></span>
      <span className="ml-1">{task.title}</span>
    </button>
  );
}

function CalendarDay({
  day,
  onEdit,
}: {
  day: any;
  onEdit: (task: TaskWithProject) => void;
}) {
  const bgClass = !day.isCurrentMonth
    ? 'bg-slate-50'
    : day.isToday
      ? 'bg-teal-50'
      : 'bg-white';

  const borderClass = !day.isCurrentMonth ? 'border-slate-100' : 'border-slate-200';

  const textColorDay = !day.isCurrentMonth ? 'text-slate-400' : 'text-slate-900';
  const textColorDate = day.isToday ? 'text-teal-600 font-semibold' : textColorDay;

  return (
    <div
      className={`min-h-[120px] border ${borderClass} ${bgClass} p-2 flex flex-col`}
    >
      <div className={`text-xs ${textColorDate} font-semibold mb-1`}>
        {day.dayOfMonth}
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {day.tasks.map((task: TaskWithProject) => (
          <TaskBadge key={task.id} task={task} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage({ projects, tasks, error }: WorkspaceData) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleEdit = (task: TaskWithProject) => {
    const event = new CustomEvent('edit-task', { detail: task });
    window.dispatchEvent(event);
  };

  if (error) {
    return (
      <main className="min-w-0 flex-1 px-5 pb-12 pt-7 sm:px-8 lg:ml-[248px] lg:px-10 lg:pt-10">
        <div className="mx-auto max-w-[1320px]">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
            <h1 className="text-lg font-semibold text-rose-900">Kalender är inte tillgänglig</h1>
            <p className="mt-1 text-sm text-rose-800">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  const weeks = getWeeksInMonth(currentDate, tasks);

  const handlePrevMonth = () => {
    setCurrentDate(getPreviousMonth(currentDate));
  };

  const handleNextMonth = () => {
    setCurrentDate(getNextMonth(currentDate));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <main className="min-w-0 flex-1 px-5 pb-12 pt-7 sm:px-8 lg:ml-[248px] lg:px-10 lg:pt-10">
      <div className="mx-auto max-w-[1320px] space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[34px]">
            Kalender
            <span className="text-teal-600">.</span>
          </h1>
          <p className="mt-2 text-[15px] text-slate-500">Se dina uppgifter på en tidsaxel</p>
        </div>

        {/* Month Navigation */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              {formatMonthYear(currentDate)}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                title="Föregående månad"
              >
                <ChevronLeft size={16} />
                Föregående
              </button>
              <button
                onClick={handleToday}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                title="Gå till idag"
              >
                Idag
              </button>
              <button
                onClick={handleNextMonth}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                title="Nästa månad"
              >
                Nästa
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.days.map((day) => (
                  <CalendarDay key={day.date.toISOString()} day={day} onEdit={handleEdit} />
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <h3 className="font-semibold text-slate-900">Inga uppgifter ännu</h3>
            <p className="mt-1 text-sm text-slate-600">
              Skapa uppgifter för att se dem här på kalendern.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
