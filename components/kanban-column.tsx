'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { TaskWithProject, TaskStatus } from '@/lib/workspace/types';
import { KanbanCard } from './kanban-card';

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: TaskWithProject[];
  onEdit: (task: TaskWithProject) => void;
}

export function KanbanColumn({ status, label, tasks, onEdit }: KanbanColumnProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-slate-600 bg-slate-200 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks container */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[400px]">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
              Inga uppgifter
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                onEdit={onEdit}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
