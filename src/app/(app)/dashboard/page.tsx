// src/app/(app)/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { DashboardData } from "@/types";

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent ? "text-brand-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

const stageLabelMap: Record<string, string> = {
  IDEA: "Idea",
  PLANNING: "Planning",
  IN_DEVELOPMENT: "In Dev",
  BETA: "Beta",
  LAUNCHED: "Launched",
};

const taskStatusColor: Record<string, string> = {
  TODO: "text-slate-400 bg-slate-800/50",
  IN_PROGRESS: "text-amber-400 bg-amber-900/30",
  DONE: "text-green-400 bg-green-900/30",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<Set<string>>(new Set());
  const [showRejectedRequests, setShowRejectedRequests] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) setData(json.data);
      else toast.error("Failed to load dashboard");
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleRequestAction(requestId: string, status: "ACCEPTED" | "REJECTED") {
    setRequesting((prev) => new Set(prev).add(requestId));
    try {
      const res = await fetch(`/api/project/join-request/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(status === "ACCEPTED" ? "Request accepted" : "Request rejected");
        await loadDashboard();
      } else {
        toast.error(json.error ?? "Action failed");
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setRequesting((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <Link href="/project/new" className="btn-primary text-sm">
          + New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Projects" value={data.stats.totalProjects} accent />
        <StatCard label="Assigned Tasks" value={data.stats.totalTasks} />
        <StatCard label="Tasks Done" value={data.stats.doneTasks} />
        <StatCard label="Pending Requests" value={data.stats.pendingRequests} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Projects */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white">My Projects</h2>
          {data.myProjects.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-500 mb-3">No projects yet</p>
              <Link href="/project/new" className="btn-primary text-sm">
                Create your first project
              </Link>
            </div>
          ) : (
            data.myProjects.map((p) => (
              <Link key={p.id} href={`/project/${p.id}`} className="card p-5 block hover:border-brand-600/50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-white font-medium">{p.name}</h3>
                  <span className="badge bg-brand-900/50 text-brand-300 shrink-0">
                    {stageLabelMap[p.stage] ?? p.stage}
                  </span>
                </div>
                <p className="text-slate-400 text-sm line-clamp-2 mb-3">{p.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.techStack.slice(0, 4).map((t) => (
                    <span key={t} className="badge bg-surface-soft text-slate-300">
                      {t}
                    </span>
                  ))}
                  {p.techStack.length > 4 && (
                    <span className="badge bg-surface-soft text-slate-500">
                      +{p.techStack.length - 4}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned Tasks */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">My Tasks</h2>
            {data.assignedTasks.length === 0 ? (
              <p className="text-slate-500 text-sm">No tasks assigned</p>
            ) : (
              <div className="space-y-2">
                {data.assignedTasks.slice(0, 6).map((t) => (
                  <div key={t.id} className="card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white text-sm truncate">{t.title}</span>
                      <span className={`badge text-xs shrink-0 ${taskStatusColor[t.status]}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      {(t as { project?: { name?: string } }).project?.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Requests */}
          {data.receivedRequests.length > 0 && (
            <div>
                  <h2 className="text-lg font-semibold text-white mb-3">
                Join Requests
                <span className="ml-2 badge bg-brand-900/50 text-brand-300 text-xs">
                  {data.receivedRequests.filter((r) => r.status === "PENDING").length}
                </span>
              </h2>
              {data.receivedRequests.some((r) => r.status === "REJECTED") && (
                <button
                  onClick={() => setShowRejectedRequests((prev) => !prev)}
                  className="btn-secondary text-xs mb-3"
                >
                  {showRejectedRequests ? "Hide rejected" : `Show rejected (${data.receivedRequests.filter((r) => r.status === "REJECTED").length})`}
                </button>
              )}
              <div className="space-y-2">
                {data.receivedRequests
                  .filter((r) => r.status === "PENDING")
                  .map((r) => (
                    <div key={r.id} className="card p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-brand-800 flex items-center justify-center text-white text-xs font-medium shrink-0">
                          {r.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm truncate">{r.user?.name}</p>
                          <p className="text-slate-500 text-xs">{(r as { project?: { name?: string } }).project?.name}</p>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="badge text-xs bg-blue-900/50 text-blue-300">PENDING</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestAction(r.id, "ACCEPTED")}
                          disabled={requesting.has(r.id)}
                          className="flex-1 bg-green-900/40 hover:bg-green-800/50 text-green-400 text-xs py-1.5 rounded transition-colors disabled:opacity-50"
                        >
                          {requesting.has(r.id) ? "Saving…" : "Accept"}
                        </button>
                        <button
                          onClick={() => handleRequestAction(r.id, "REJECTED")}
                          disabled={requesting.has(r.id)}
                          className="flex-1 bg-red-900/30 hover:bg-red-800/40 text-red-400 text-xs py-1.5 rounded transition-colors disabled:opacity-50"
                        >
                          {requesting.has(r.id) ? "Saving…" : "Reject"}
                        </button>
                      </div>
                    </div>
                  ))}
                {data.receivedRequests.filter((r) => r.status === "PENDING").length === 0 && (
                  <p className="text-slate-500 text-sm">No pending join requests.</p>
                )}
              </div>
              {showRejectedRequests && (
                <div className="mt-4 space-y-2">
                  {data.receivedRequests.filter((r) => r.status === "REJECTED").map((r) => (
                    <div key={r.id} className="card p-3 border-red-900/30 bg-surface-card">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-brand-800 flex items-center justify-center text-white text-xs font-medium shrink-0">
                          {r.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm truncate">{r.user?.name}</p>
                          <p className="text-slate-500 text-xs">{(r as { project?: { name?: string } }).project?.name}</p>
                        </div>
                      </div>
                      <span className="badge text-xs bg-red-900/30 text-red-300">REJECTED</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
