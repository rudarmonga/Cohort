// src/components/task/AddTaskModal.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { createTaskSchema, CreateTaskInput } from "@/lib/validators";
import { UserSummary } from "@/types";

interface Props {
  projectId: string;
  members: { user: UserSummary; role: string }[];
  onClose: () => void;
  onCreated: (task: CreateTaskInput & { id: string; assignee: UserSummary | null }) => void;
}

export function AddTaskModal({ projectId, members, onClose, onCreated }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { status: "TODO" },
  });

  async function onSubmit(data: CreateTaskInput) {
    try {
      const body = {
        ...data,
        assigneeId: data.assigneeId ? data.assigneeId : null,
      };

      const res = await fetch(`/api/project/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Task created");
        onCreated(json.data.task);
        onClose();
      } else {
        toast.error(json.error ?? "Failed to create task");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-md animate-slide-up">
        <h2 className="text-white font-semibold text-lg mb-4">Add Task</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input {...register("title")} className="input" placeholder="Task title" autoFocus />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea {...register("description")} className="input min-h-[80px] resize-none" placeholder="Details…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select {...register("status")} className="input">
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label className="label">Assignee</label>
              <select {...register("assigneeId")} className="input">
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? "Adding…" : "Add Task"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
