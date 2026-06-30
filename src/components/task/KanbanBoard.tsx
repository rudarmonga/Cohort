// src/components/task/KanbanBoard.tsx
"use client";
import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";
import { Task, TaskStatus, UserSummary } from "@/types";

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "TODO", label: "To Do", color: "text-slate-400" },
  { id: "IN_PROGRESS", label: "In Progress", color: "text-amber-400" },
  { id: "DONE", label: "Done", color: "text-green-400" },
];

function moveTaskToStatus(tasks: Task[], activeTaskId: string, targetId: string | undefined, targetStatus: TaskStatus) {
  const activeTask = tasks.find((task) => task.id === activeTaskId);
  if (!activeTask) return tasks;

  const withoutActive = tasks.filter((task) => task.id !== activeTaskId);
  const grouped = Object.fromEntries(
    COLUMNS.map((column) => [column.id, withoutActive.filter((task) => task.status === column.id)])
  ) as Record<TaskStatus, Task[]>;

  const targetTasks = grouped[targetStatus];
  const updatedTask = { ...activeTask, status: targetStatus };

  let insertIndex = targetTasks.length;
  if (targetId) {
    const targetTask = withoutActive.find((task) => task.id === targetId);
    if (targetTask?.status === targetStatus) {
      insertIndex = targetTasks.findIndex((task) => task.id === targetId);
      if (insertIndex < 0) insertIndex = targetTasks.length;
    }
  }

  const nextTargetTasks = [...targetTasks];
  nextTargetTasks.splice(insertIndex, 0, updatedTask);
  grouped[targetStatus] = nextTargetTasks;

  return COLUMNS.flatMap((column) => grouped[column.id] ?? []);
}

function TaskCard({
  task,
  isDragging,
  onDelete,
  onEdit,
  canManage,
  canEdit,
  currentUserId,
  canDeleteByAdmins,
  deletingTaskId,
}: {
  task: Task;
  isDragging?: boolean;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  canManage: boolean;
  canEdit: boolean;
  currentUserId?: string | null;
  canDeleteByAdmins: boolean;
  deletingTaskId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: task.id,
      disabled: !canManage,
      data: { type: "task", task },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    touchAction: "none" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-3 ${canManage ? "cursor-grab active:cursor-grabbing" : "cursor-default"} hover:border-brand-600/40 transition-colors`}
      {...attributes}
      {...listeners}
    >
      <p className="text-white text-sm font-medium mb-1 leading-snug">{task.title}</p>
      {task.description && (
        <p className="text-slate-500 text-xs line-clamp-2 mb-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-brand-800 flex items-center justify-center text-white text-[10px] font-medium">
              {task.assignee.name[0].toUpperCase()}
            </div>
            <span className="text-slate-500 text-xs">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="text-slate-600 text-xs">Unassigned</span>
        )}
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onEdit(task)}
              className="text-slate-600 hover:text-brand-300 text-xs transition-colors"
            >
              Edit
            </button>
          )}
          {canDeleteByAdmins && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onDelete(task.id)}
              disabled={deletingTaskId === task.id}
              className="text-slate-600 hover:text-red-400 text-xs transition-colors disabled:opacity-50"
            >
              {deletingTaskId === task.id ? "Deleting…" : "✕"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({
  column,
  tasks,
  onDelete,
  onEdit,
  canManage,
  canEdit,
  currentUserId,
  canDeleteByAdmins,
  deletingTaskId,
}: {
  column: (typeof COLUMNS)[number];
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  canManage: boolean;
  canEdit: boolean;
  currentUserId?: string | null;
  canDeleteByAdmins: boolean;
  deletingTaskId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div className="flex items-center gap-2 mb-3">
        <h3 className={`text-sm font-semibold ${column.color}`}>{column.label}</h3>
        <span className="badge bg-surface-card text-slate-500 text-xs">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[220px] space-y-2 rounded-xl border border-transparent p-2 transition-colors ${
          isOver ? "bg-surface-soft/60 border-brand-600/40" : ""
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDelete}
              onEdit={onEdit}
              canManage={canManage}
              canEdit={canEdit}
              currentUserId={currentUserId}
              canDeleteByAdmins={canDeleteByAdmins}
              deletingTaskId={deletingTaskId}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="border-2 border-dashed border-surface-border rounded-xl h-20 flex items-center justify-center">
            <p className="text-slate-600 text-xs">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  tasks: initialTasks,
  projectId,
  canManage,
  canEdit,
  currentUserId,
  canDeleteByAdmins,
  members,
}: {
  tasks: Task[];
  projectId: string;
  canManage: boolean;
  canEdit: boolean;
  currentUserId?: string | null;
  canDeleteByAdmins: boolean;
  members: { user: UserSummary; role: string }[];
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<TaskStatus>("TODO");
  const [editAssigneeId, setEditAssigneeId] = useState<string>("");
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const targetId = over.id as string;
    const targetTask = tasks.find((task) => task.id === targetId);
    const targetStatus =
      (over.data.current?.type === "column"
        ? (over.data.current.columnId as TaskStatus)
        : targetTask?.status) ?? undefined;

    if (!targetStatus) return;

    const originalTasks = [...tasks];
    const nextTasks = moveTaskToStatus(tasks, taskId, over.data.current?.type === "task" ? targetId : undefined, targetStatus);
    setTasks(nextTasks);

    if (targetStatus === tasks.find((task) => task.id === taskId)?.status) {
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("Task moved");
    } catch {
      setTasks(originalTasks);
      toast.error("Failed to update task status");
    }
  }

  async function deleteTask(taskId: string) {
    const confirmed = confirm("Delete this task?");
    if (!confirmed) return;

    setDeletingTaskId(taskId);
    const originalTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Task deleted");
    } catch {
      setTasks(originalTasks);
      toast.error("Failed to delete task");
    } finally {
      setDeletingTaskId(null);
    }
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditStatus(task.status);
    setEditAssigneeId(task.assignee?.id ?? "");
  }

  function closeEditModal() {
    setEditingTask(null);
    setIsSavingTask(false);
  }

  async function saveTaskEdits() {
    if (!editingTask) return;
    setIsSavingTask(true);

    try {
      const body = {
        title: editTitle,
        description: editDescription || null,
        status: editStatus,
        assigneeId: editAssigneeId || null,
      };

      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update task");

      const updatedTask: Task = {
        ...editingTask,
        title: editTitle,
        description: editDescription || null,
        status: editStatus,
        assignee: editAssigneeId
          ? members.find((m) => m.user.id === editAssigneeId)?.user ?? null
          : null,
      };

      setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
      toast.success("Task updated");
      closeEditModal();
    } catch {
      toast.error("Failed to update task");
    } finally {
      setIsSavingTask(false);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={tasks.filter((t) => t.status === col.id)}
            onDelete={deleteTask}
            onEdit={openEditTask}
            canManage={canManage}
            canEdit={canEdit}
            currentUserId={currentUserId}
            canDeleteByAdmins={canDeleteByAdmins}
            deletingTaskId={deletingTaskId}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            isDragging
            onDelete={() => {}}
            onEdit={() => {}}
            canManage={false}
            canEdit={false}
            currentUserId={currentUserId}
            canDeleteByAdmins={canDeleteByAdmins}
            deletingTaskId={deletingTaskId}
          />
        )}
      </DragOverlay>

      {editingTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-lg animate-slide-up">
            <h2 className="text-white font-semibold text-lg mb-4">Edit Task</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="input min-h-[80px] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                    className="input"
                  >
                    {COLUMNS.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Assignee</label>
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="input"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.user.id} value={member.user.id}>
                        {member.user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveTaskEdits}
                  disabled={isSavingTask}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {isSavingTask ? "Saving…" : "Save Changes"}
                </button>
                <button
                  onClick={closeEditModal}
                  disabled={isSavingTask}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}
