'use client';

import { Check, Circle, CircleDashed, GripVertical, Calendar } from 'lucide-react';
import { formatDueDate, isWorkspaceTaskOverdue } from '@/lib/workspace/dashboard';
import type { TaskWithProject } from '@/lib/workspace/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { forwardRef } from 'react';

const statusStyles = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-50 text-blue-700',
  done: 'bg-emerald-50 text-emerald-700',
} as const;

const priorityDotStyles = {
  low: 'bg-slate-300',
  medium: 'bg-amber-500',
  high: 'bg-rose-500',
} as const;

function StatusIcon({ status }: { status: TaskWithProject['status'] }) {
  if (status === 'done') return <Check size={13} aria-hidden="true" />;
  if (status === 'in_progress') return <CircleDashed size={13} aria-hidden="true" />;
  return <Circle size={13} aria-hidden="true" />;
}

interface KanbanCardProps {
  task: TaskWithProject;
  onEdit: (task: TaskWithProject) => void;
}

export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  ({ task, onEdit }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const isOverdue = isWorkspaceTaskOverdue(task);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`
          border border-slate-200 bg-white rounded-lg p-3.5
          hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing
          ${isDragging ? 'opacity-50 shadow-lg' : ''}
        `}
        {...attributes}
        {...listeners}
      >
        {/* Header with grip and title */}
        <div className="flex items-start gap-2 mb-2">
          <GripVertical size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4
              className={`
                text-sm font-medium leading-tight break-words
                ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900'}
              `}
            >
              {task.title}
            </h4>
          </div>
        </div>

        {/* Status and priority row */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusStyles[task.status]}`}>
            <StatusIcon status={task.status} />
            <span>{task.status === 'done' ? 'Klar' : task.status === 'in_progress' ? 'Pågår' : 'Att göra'}</span>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${priorityDotStyles[task.priority]}`} title={`Prioritet: ${task.priority}`} />
        </div>

        {/* Due date */}
        {task.due_date && (
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>
            <Calendar size={12} />
            <span>{formatDueDate(task.due_date)}</span>
          </div>
        )}

        {/* Project name */}
        <div className="text-xs text-slate-500 mt-2 truncate">
          {task.project.name}
        </div>

        {/* Action button */}
        <button
          onClick={() => onEdit(task)}
          className="mt-2 w-full text-left text-xs text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition-colors"
        >
          Redigera
        </button>
      </div>
    );
  }
);

KanbanCard.displayName = 'KanbanCard';
