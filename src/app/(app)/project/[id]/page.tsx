// src/app/(app)/project/[id]/page.tsx
"use client";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { KanbanBoard } from "@/components/task/KanbanBoard";
import { AddTaskModal } from "@/components/task/AddTaskModal";
import { useAppSelector } from "@/store/hooks";
import { Project, Task, Role } from "@/types";

const STAGE_LABELS: Record<string, string> = {
  IDEA: "Idea", PLANNING: "Planning", IN_DEVELOPMENT: "In Dev", BETA: "Beta", LAUNCHED: "Launched",
};

const ROLE_COLORS: Record<Role, string> = {
  OWNER: "text-yellow-400 bg-yellow-900/30",
  ADMIN: "text-blue-400 bg-blue-900/30",
  MEMBER: "text-slate-300 bg-slate-800/50",
};

type Tab = "board" | "members" | "settings";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  const [project, setProject] = useState<
    Project & {
      tasks: Task[];
      joinRequests?: {
        id: string;
        status: string;
        user: { id: string; name: string; username: string; email: string; profilePicture: string | null };
      }[];
    }
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("board");
  const [showAddTask, setShowAddTask] = useState(false);
  const [transferTo, setTransferTo] = useState("");
  const [showRejectedRequests, setShowRejectedRequests] = useState(false);
  const [managingRequestId, setManagingRequestId] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isLeavingProject, setIsLeavingProject] = useState(false);
  const [isTransferringOwnership, setIsTransferringOwnership] = useState(false);

  const loadProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/project/${id}`);
      const json = await res.json();
      if (json.success) {
        setProject(json.data.project);
      } else {
        toast.error("Project not found");
      }
    } catch {
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-400">Project not found.</p>
        <button onClick={() => router.push("/dashboard")} className="btn-secondary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const myMembership = project.members.find((m) => m.user.id === user?.id);
  const myRole = myMembership?.role as Role | undefined;
  const isOwner = myRole === "OWNER";
  const isAdmin = myRole === "ADMIN";
  const isMember = !!myMembership;
  const canManageMembers = isOwner || isAdmin; // manage members (owner/admin)
  const canCreateTasks = isOwner || isAdmin; // only owner/admin can create tasks
  const canModifyTasks = isMember; // allow members to drag/update task status

  async function handleDeleteProject() {
    if (!confirm(`Delete "${project!.name}"? This cannot be undone.`)) return;
    setIsDeletingProject(true);
    try {
      const res = await fetch(`/api/project/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Project deleted");
        router.push("/dashboard");
      } else {
        toast.error(json.error ?? "Failed to delete project");
      }
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setIsDeletingProject(false);
    }
  }

  async function handleLeaveProject() {
    if (!confirm("Leave this project?")) return;
    setIsLeavingProject(true);
    try {
      const res = await fetch(`/api/project/leave/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("You left the project");
        router.push("/dashboard");
      } else {
        toast.error(json.error ?? "Failed to leave project");
      }
    } catch {
      toast.error("Failed to leave project");
    } finally {
      setIsLeavingProject(false);
    }
  }

  async function handleRequestAction(requestId: string, status: "ACCEPTED" | "REJECTED") {
    setManagingRequestId(requestId);
    try {
      const res = await fetch(`/api/project/join-request/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(status === "ACCEPTED" ? "Request accepted" : "Request rejected");
        await loadProject();
      } else {
        toast.error(json.error ?? "Action failed");
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setManagingRequestId(null);
    }
  }

  async function handleChangeRole(userId: string, name: string, role: "ADMIN" | "MEMBER") {
    const action = role === "ADMIN" ? "make admin" : "remove admin";
    const confirmed = confirm(
      role === "ADMIN" ? `Make ${name} an admin?` : `Remove ${name}'s admin role?`
    );
    if (!confirmed) return;

    const res = await fetch(`/api/project/${id}/member/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();

    if (json.success) {
      toast.success(role === "ADMIN" ? "Admin role assigned" : "Admin role removed");
      setProject((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.map((m) =>
                m.user.id === userId ? { ...m, role } : m
              ),
            }
          : prev
      );
    } else {
      toast.error(json.error ?? `Failed to ${action}`);
    }
  }

  async function handleRemoveMember(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this project?`)) return;
    const res = await fetch(`/api/project/${id}/member/${userId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Member removed");
      setProject((prev) =>
        prev
          ? { ...prev, members: prev.members.filter((m) => m.user.id !== userId) }
          : prev
      );
    } else {
      toast.error(json.error ?? "Failed to remove member");
    }
  }

  async function handleTransferOwnership() {
    if (!transferTo || !project) return;
    const member = project.members.find((m) => m.user.id === transferTo);
    if (!member || !confirm(`Transfer ownership to ${member.user.name}?`)) return;

    setIsTransferringOwnership(true);
    try {
      const res = await fetch(`/api/project/transfer-ownership/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOwnerId: transferTo }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Ownership transferred");
        await loadProject();
      } else {
        toast.error(json.error ?? "Failed to transfer ownership");
      }
    } catch {
      toast.error("Failed to transfer ownership");
    } finally {
      setIsTransferringOwnership(false);
    }
  }

  const tasks = (project as unknown as { tasks: Task[] }).tasks ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <span className="badge bg-brand-900/50 text-brand-300 text-xs">
              {STAGE_LABELS[project.stage] ?? project.stage}
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-xl">{project.description}</p>
        </div>

        <div className="flex items-center gap-2">
          {isMember && !isOwner && (
            <button
              onClick={handleLeaveProject}
              disabled={isLeavingProject}
              className="btn-danger text-sm disabled:opacity-50"
            >
              {isLeavingProject ? "Leaving…" : "Leave"}
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleDeleteProject}
              disabled={isDeletingProject}
              className="btn-danger text-sm disabled:opacity-50"
            >
              {isDeletingProject ? "Deleting…" : "Delete Project"}
            </button>
          )}
          {canCreateTasks && (
            <button onClick={() => setShowAddTask(true)} className="btn-primary text-sm">
              + Add Task
            </button>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-6">
        {project.techStack.map((t) => (
          <span key={t} className="badge bg-surface-card text-slate-300 text-xs">{t}</span>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-border mb-6">
        {(["board", "members", ...(isOwner ? ["settings"] : [])] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-brand-500 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Board Tab */}
          {tab === "board" && (
        <div>
          {!isMember && (
            <div className="card p-4 mb-6 text-amber-300 text-sm bg-amber-900/20 border-amber-800/40">
              You are not a member of this project. Join to interact with tasks.
            </div>
          )}
          <KanbanBoard
            tasks={tasks}
            projectId={id}
            canManage={canModifyTasks}
            canEdit={canCreateTasks}
            currentUserId={user?.id}
            canDeleteByAdmins={canManageMembers}
            members={project.members}
          />
        </div>
      )}

      {/* Members Tab */}
      {tab === "members" && (
        <div className="max-w-lg space-y-3">
          <h2 className="text-lg font-semibold text-white mb-4">
            Members <span className="text-slate-500 text-sm font-normal">({project.members.length})</span>
          </h2>
          {project.members.map((m) => (
            <div key={m.user.id} className="card p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-800 flex items-center justify-center text-white font-medium text-sm shrink-0">
                  {m.user.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{m.user.name}</p>
                  <p className="text-slate-500 text-xs">@{m.user.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge text-xs ${ROLE_COLORS[m.role as Role]}`}>
                  {m.role}
                </span>
                {canManageMembers && m.user.id !== user?.id && m.role !== "OWNER" && (
                  <div className="flex items-center gap-2">
                    {m.role === "MEMBER" && (
                      <button
                        onClick={() => handleChangeRole(m.user.id, m.user.name, "ADMIN")}
                        className="text-slate-400 hover:text-brand-400 text-xs transition-colors"
                      >
                        Make Admin
                      </button>
                    )}
                    {isOwner && m.role === "ADMIN" && (
                      <button
                        onClick={() => handleChangeRole(m.user.id, m.user.name, "MEMBER")}
                        className="text-slate-400 hover:text-amber-400 text-xs transition-colors"
                      >
                        Remove Admin
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveMember(m.user.id, m.user.name)}
                      className="text-slate-600 hover:text-red-400 text-xs transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {canManageMembers && (
            <div className="card p-4 border-brand-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Join Requests</h2>
                  <p className="text-slate-500 text-sm">Pending requests for this project.</p>
                </div>
                {project.joinRequests?.filter((r) => r.status === "REJECTED").length ? (
                  <button
                    onClick={() => setShowRejectedRequests((prev) => !prev)}
                    className="btn-secondary text-xs"
                  >
                    {showRejectedRequests ? "Hide rejected" : `Show rejected (${project.joinRequests.filter((r) => r.status === "REJECTED").length})`}
                  </button>
                ) : null}
              </div>

              {project.joinRequests?.filter((r) => r.status === "PENDING").length ? (
                <div className="space-y-3">
                  {project.joinRequests
                    .filter((r) => r.status === "PENDING")
                    .map((request) => (
                      <div key={request.id} className="card p-3 bg-surface-card border border-surface-border">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-white text-sm">{request.user.name}</p>
                            <p className="text-slate-500 text-xs">@{request.user.username}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRequestAction(request.id, "ACCEPTED")}
                              disabled={managingRequestId === request.id}
                              className="btn-primary text-xs py-1.5"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRequestAction(request.id, "REJECTED")}
                              disabled={managingRequestId === request.id}
                              className="btn-secondary text-xs py-1.5"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No pending join requests.</p>
              )}

              {showRejectedRequests && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-white mb-3">Rejected requests</h3>
                  {project.joinRequests?.filter((r) => r.status === "REJECTED").length ? (
                    <div className="space-y-3">
                      {project.joinRequests
                        .filter((r) => r.status === "REJECTED")
                        .map((request) => (
                          <div key={request.id} className="card p-3 bg-surface-card border border-surface-border">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-white text-sm">{request.user.name}</p>
                                <p className="text-slate-500 text-xs">@{request.user.username}</p>
                              </div>
                              <button
                                onClick={() => handleRequestAction(request.id, "ACCEPTED")}
                                disabled={managingRequestId === request.id}
                                className="btn-primary text-xs py-1.5"
                              >
                                Accept
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No rejected requests to show.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {project.lookingFor.length > 0 && (
            <div className="mt-6">
              <h3 className="text-slate-400 text-sm font-medium mb-2">Looking for</h3>
              <div className="flex flex-wrap gap-2">
                {project.lookingFor.map((r) => (
                  <span key={r} className="badge bg-brand-900/40 text-brand-300 text-xs">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab (Owner only) */}
      {tab === "settings" && isOwner && (
        <div className="max-w-md space-y-6">
          <h2 className="text-lg font-semibold text-white">Project Settings</h2>

          {/* Transfer Ownership */}
          <div className="card p-5">
            <h3 className="text-white font-medium mb-3">Transfer Ownership</h3>
            <p className="text-slate-400 text-sm mb-4">
              Transfer this project to another member. You will become a regular member.
            </p>
            <select
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              className="input mb-3"
            >
              <option value="">Select a member…</option>
              {project.members
                .filter((m) => m.user.id !== user?.id)
                .map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name} (@{m.user.username})
                  </option>
                ))}
            </select>
            <button
              onClick={handleTransferOwnership}
              disabled={!transferTo || isTransferringOwnership}
              className="btn-secondary w-full disabled:opacity-50"
            >
              {isTransferringOwnership ? "Transferring…" : "Transfer Ownership"}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="card p-5 border-red-900/50">
            <h3 className="text-red-400 font-medium mb-3">Danger Zone</h3>
            <p className="text-slate-400 text-sm mb-4">
              Permanently delete this project and all its data. This cannot be undone.
            </p>
            <button onClick={handleDeleteProject} className="btn-danger w-full">
              Delete Project
            </button>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal
          projectId={id}
          members={project.members}
          onClose={() => setShowAddTask(false)}
          onCreated={(newTask) => {
            setProject((prev) =>
              prev
                ? {
                    ...prev,
                    tasks: [
                      ...(prev as unknown as { tasks: Task[] }).tasks,
                      newTask as unknown as Task,
                    ],
                  }
                : prev
            );
          }}
        />
      )}
    </div>
  );
}
