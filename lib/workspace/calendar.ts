import type { TaskWithProject } from './types';

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskWithProject[];
}

export interface CalendarWeek {
  weekStart: Date;
  days: CalendarDay[];
}

export function groupTasksByDueDate(tasks: TaskWithProject[]): Map<string, TaskWithProject[]> {
  const map = new Map<string, TaskWithProject[]>();

  tasks.forEach((task) => {
    if (!task.due_date) return;

    const dateStr = task.due_date;
    if (!map.has(dateStr)) {
      map.set(dateStr, []);
    }
    map.get(dateStr)!.push(task);
  });

  return map;
}

export function getDaysInMonth(date: Date, tasks: TaskWithProject[]): CalendarDay[] {
  const tasksByDate = groupTasksByDueDate(tasks);
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = new Date(startDate);
  while (current <= lastDay || current.getDay() !== 0) {
    const dateStr = current.toISOString().split('T')[0];
    const isCurrentMonth = current.getMonth() === month;
    const isToday = current.getTime() === today.getTime();

    days.push({
      date: new Date(current),
      dayOfMonth: current.getDate(),
      isCurrentMonth,
      isToday,
      tasks: tasksByDate.get(dateStr) || [],
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function getWeeksInMonth(date: Date, tasks: TaskWithProject[]): CalendarWeek[] {
  const days = getDaysInMonth(date, tasks);
  const weeks: CalendarWeek[] = [];

  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7);
    weeks.push({
      weekStart: weekDays[0].date,
      days: weekDays,
    });
  }

  return weeks;
}

export function getTasksForDay(tasks: TaskWithProject[], date: Date): TaskWithProject[] {
  const dateStr = date.toISOString().split('T')[0];
  return tasks.filter((task) => task.due_date === dateStr);
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
}

export function getPreviousMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

export function getNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}
