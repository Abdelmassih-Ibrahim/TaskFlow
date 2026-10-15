import type { TaskWithProject } from './types';
import { isWorkspaceTaskOverdue } from './dashboard';

export interface BurndownPoint {
  date: string;
  todo: number;
  in_progress: number;
  done: number;
}

export interface VelocityWeek {
  week: string;
  completed: number;
}

export interface ProjectReport {
  projectId: string;
  projectName: string;
  total: number;
  completed: number;
  overdue: number;
  percentage: number;
}

export function calculateBurndownData(tasks: TaskWithProject[]): BurndownPoint[] {
  if (tasks.length === 0) return [];

  const dateMap = new Map<string, BurndownPoint>();
  const today = new Date();

  tasks.forEach((task) => {
    if (!task.due_date) return;

    const dueDate = new Date(task.due_date);
    if (dueDate > today) return;

    const dateStr = new Date(task.due_date).toLocaleDateString('sv-SE');

    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { date: dateStr, todo: 0, in_progress: 0, done: 0 });
    }

    const point = dateMap.get(dateStr)!;
    if (task.status === 'todo') point.todo++;
    else if (task.status === 'in_progress') point.in_progress++;
    else if (task.status === 'done') point.done++;
  });

  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function calculateVelocity(tasks: TaskWithProject[]): VelocityWeek[] {
  const weekMap = new Map<string, number>();
  const today = new Date();

  tasks.forEach((task) => {
    if (task.status !== 'done' || !task.updated_at) return;

    const updatedDate = new Date(task.updated_at);
    if (updatedDate > today) return;

    const weekStart = new Date(updatedDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStr = weekStart.toLocaleDateString('sv-SE');

    weekMap.set(weekStr, (weekMap.get(weekStr) || 0) + 1);
  });

  return Array.from(weekMap.entries())
    .map(([week, completed]) => ({ week, completed }))
    .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
    .slice(-12);
}

export function getProjectSummaries(tasks: TaskWithProject[]): ProjectReport[] {
  const projectMap = new Map<
    string,
    { name: string; total: number; completed: number; overdue: number }
  >();

  tasks.forEach((task) => {
    const projectId = task.project_id;
    const projectName = task.project.name;

    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, {
        name: projectName,
        total: 0,
        completed: 0,
        overdue: 0,
      });
    }

    const proj = projectMap.get(projectId)!;
    proj.total++;
    if (task.status === 'done') proj.completed++;
    if (isWorkspaceTaskOverdue(task)) proj.overdue++;
  });

  return Array.from(projectMap.entries()).map(([projectId, data]) => ({
    projectId,
    projectName: data.name,
    total: data.total,
    completed: data.completed,
    overdue: data.overdue,
    percentage:
      data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
  }));
}

export function getStatusDistribution(tasks: TaskWithProject[]) {
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const in_progress = tasks.filter((t) => t.status === 'in_progress').length;
  const done = tasks.filter((t) => t.status === 'done').length;

  return [
    { name: 'Att göra', value: todo, fill: '#cbd5e1' },
    { name: 'Pågår', value: in_progress, fill: '#3b82f6' },
    { name: 'Klar', value: done, fill: '#10b981' },
  ];
}
