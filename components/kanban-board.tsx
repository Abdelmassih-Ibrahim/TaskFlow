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
import type { ProjectMember, TaskWithProject, TaskStatus } from '@/lib/workspace/types';
import type { WorkspaceActionState } from '@/lib/workspace/validation';
import { groupTasksByStatus, isValidTargetStatus, KANBAN_COLUMNS } from '@/lib/workspace/kanban';
import { KanbanColumn } from './kanban-column';
import { reorderTasks } from '@/app/actions/workspace';

interface KanbanBoardProps {
  filteredTasks: TaskWithProject[];
  members: ProjectMember[];
  onEdit: (task: TaskWithProject) => void;
}

type PendingChanges = {
  base: TaskWithProject[];
  statuses: Record<string, TaskStatus>;
  positions: Record<string, number>;
};

const noPendingChanges: Omit<PendingChanges, "base"> = { statuses: {}, positions: {} };

export function KanbanBoard({ filteredTasks, members, onEdit }: KanbanBoardProps) {
  const [pending, setPending] = useState<PendingChanges>({ base: filteredTasks, statuses: {}, positions: {} });
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const changes = pending.base === filteredTasks ? pending : { base: filteredTasks, ...noPendingChanges };
  const displayedTasks = filteredTasks.map((task) => ({
    ...task,
    status: changes.statuses[task.id] ?? task.status,
    position: changes.positions[task.id] ?? task.position,
  }));
  const tasksByStatus = groupTasksByStatus(displayedTasks);
  for (const column of KANBAN_COLUMNS) {
    tasksByStatus[column.id].sort((a, b) => a.position - b.position);
  }

  const assigneeEmailFor = (userId: string | null) =>
    userId ? members.find((member) => member.user_id === userId)?.user_email ?? null : null;

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

    const taskId = String(active.id);
    const overId = String(over.id);
    const task = displayedTasks.find((t) => t.id === taskId);
    if (!task) return;

    const overIsColumn = isValidTargetStatus(overId);
    const targetStatus: TaskStatus | undefined = overIsColumn
      ? overId
      : displayedTasks.find((t) => t.id === overId)?.status;
    if (!targetStatus) return;

    const targetColumn = tasksByStatus[targetStatus];
    const withoutTask = targetColumn.filter((t) => t.id !== taskId);
    const overIndex = overIsColumn ? -1 : withoutTask.findIndex((t) => t.id === overId);
    const insertAt = overIndex === -1 ? withoutTask.length : overIndex;

    const originalIndex = targetColumn.findIndex((t) => t.id === taskId);
    if (task.status === targetStatus && insertAt === originalIndex) return;

    const reordered = [
      ...withoutTask.slice(0, insertAt),
      { ...task, status: targetStatus },
      ...withoutTask.slice(insertAt),
    ];

    setPending({
      base: filteredTasks,
      statuses: { ...changes.statuses, [taskId]: targetStatus },
      positions: {
        ...changes.positions,
        ...Object.fromEntries(reordered.map((t, index) => [t.id, index + 1])),
      },
    });

    startTransition(async () => {
      const formData = new FormData();
      formData.append('status', targetStatus);
      formData.append('taskIds', JSON.stringify(reordered.map((t) => t.id)));

      const result = (await reorderTasks(
        { status: 'idle' } as WorkspaceActionState,
        formData,
      )) as WorkspaceActionState;

      if (result.status === 'error') {
        setPending({ base: filteredTasks, ...noPendingChanges });
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
              assigneeEmailFor={assigneeEmailFor}
              onEdit={onEdit}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}
