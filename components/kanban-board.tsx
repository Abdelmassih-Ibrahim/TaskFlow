'use client';

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
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

export function KanbanBoard({ filteredTasks, onEdit }: KanbanBoardProps) {
  const [optimisticTasks, setOptimisticTasks] = useState<TaskWithProject[]>(filteredTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const tasksByStatus = groupTasksByStatus(optimisticTasks);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedTaskId(event.active.id as string);
    setError(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTaskId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    if (!isValidTargetStatus(newStatus)) {
      return;
    }

    const task = optimisticTasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status === newStatus) {
      return;
    }

    setOptimisticTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', taskId);
      formData.append('status', newStatus);

      const result = (await updateTaskStatusAction(
        { status: 'idle' } as WorkspaceActionState,
        formData
      )) as WorkspaceActionState;

      if (result.status === 'error') {
        setOptimisticTasks(filteredTasks);
        setError(result.message || 'Kunde inte uppdatera uppgiften');
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
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
              status={column.id as TaskStatus}
              label={column.label}
              tasks={tasksByStatus[column.id as TaskStatus] || []}
              onEdit={onEdit}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}
