'use client';

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState, useTransition } from 'react';
import type { TaskWithProject, TaskStatus } from '@/lib/workspace/types';
import type { WorkspaceActionState } from '@/lib/workspace/validation';
import { groupTasksByStatus, isValidTargetStatus, KANBAN_COLUMNS } from '@/lib/workspace/kanban';
import { KanbanColumn } from './kanban-column';
import { updateTaskStatusAction } from '@/app/actions/workspace';

interface KanbanBoardProps {
  filteredTasks: TaskWithProject[];
  onEdit: (task: TaskWithProject) => void;
}

type PendingStatuses = {
  base: TaskWithProject[];
  statuses: Record<string, TaskStatus>;
};

export function KanbanBoard({ filteredTasks, onEdit }: KanbanBoardProps) {
  const [pending, setPending] = useState<PendingStatuses>({ base: filteredTasks, statuses: {} });
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pendingStatuses = pending.base === filteredTasks ? pending.statuses : {};
  const displayedTasks = filteredTasks.map((task) =>
    pendingStatuses[task.id] ? { ...task, status: pendingStatuses[task.id] } : task,
  );
  const tasksByStatus = groupTasksByStatus(displayedTasks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = () => {
    setError(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = displayedTasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetStatus = isValidTargetStatus(over.id)
      ? over.id
      : displayedTasks.find((t) => t.id === over.id)?.status;
    if (!targetStatus || task.status === targetStatus) return;

    setPending((prev) => ({
      base: filteredTasks,
      statuses: {
        ...(prev.base === filteredTasks ? prev.statuses : {}),
        [taskId]: targetStatus,
      },
    }));

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', taskId);
      formData.append('status', targetStatus);

      const result = (await updateTaskStatusAction(
        { status: 'idle' } as WorkspaceActionState,
        formData
      )) as WorkspaceActionState;

      if (result.status === 'error') {
        setPending((prev) => {
          const statuses = { ...prev.statuses };
          delete statuses[taskId];
          return { base: filteredTasks, statuses };
        });
        setError(result.message || 'Kunde inte uppdatera uppgiften');
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 auto-rows-max">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              status={column.id}
              label={column.label}
              tasks={tasksByStatus[column.id]}
              onEdit={onEdit}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}
