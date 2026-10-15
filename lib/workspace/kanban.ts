import type { TaskWithProject, TaskStatus } from './types';

export type TasksByStatus = {
  todo: TaskWithProject[];
  in_progress: TaskWithProject[];
  done: TaskWithProject[];
};

export function groupTasksByStatus(tasks: TaskWithProject[]): TasksByStatus {
  return {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };
}

export function isValidTargetStatus(status: unknown): status is TaskStatus {
  return ['todo', 'in_progress', 'done'].includes(status as string);
}

export const KANBAN_COLUMNS = [
  { id: 'todo', label: 'Att göra' },
  { id: 'in_progress', label: 'Pågår' },
  { id: 'done', label: 'Klar' },
] as const;
