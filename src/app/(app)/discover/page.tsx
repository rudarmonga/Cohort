// src/app/(app)/discover/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

const STAGES = ["IDEA", "PLANNING", "IN_DEVELOPMENT", "BETA", "LAUNCHED"] as const;
const STAGE_LABELS: Record<string, string> = {
  IDEA: "Idea", PLANNING: "Planning", IN_DEVELOPMENT: "In Dev", BETA: "Beta", LAUNCHED: "Launched",
};

interface DiscoverProject {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  stage: string;
  lookingFor: string[];
  createdBy: { id: string; name: string; username: string };
  _count: { members: number; tasks: number };
  joinRequests: { id: string; status: string; updatedAt: string }[];
  members: { id: string; role: string }[];
}

export default function DiscoverPage() {
  const [projects, setProjects] = useState<DiscoverProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tech, setTech] = useState("");
  const [stage, setStage] = useState("");
  const [requesting, setRequesting] = useState<Set<string>>(new Set());

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tech) params.set("tech", tech);
    if (stage) params.set("stage", stage);
    const res = await fetch(`/api/project/discovery?${params}`);
    const json = await res.json();
    if (json.success) setProjects(json.data.projects);
    setLoading(false);
  }, [q, tech, stage]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  async function handleJoin(projectId: string) {
    setRequesting((prev) => new Set(prev).add(projectId));
    try {
      const res = await fetch("/api/project/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Join request sent!");
        await fetchProjects();
      } else {
        toast.error(json.error ?? "Failed to send request");
      }
    } finally {
      setRequesting((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  }

  async function handleWithdraw(projectId: string, requestId: string) {
    setRequesting((prev) => new Set(prev).add(projectId));
    try {
      const res = await fetch(`/api/project/join-request/${requestId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Join request withdrawn");
        await fetchProjects();
      } else {
        toast.error(json.error ?? "Failed to withdraw request");
      }
    } finally {
      setRequesting((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">Discover Projects</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or description…"
          className="input max-w-xs"
        />
        <input
          value={tech}
          onChange={(e) => setTech(e.target.value)}
          placeholder="Filter by technology…"
          className="input max-w-[180px]"
        />
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="input max-w-[160px]"
        >
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>
        {(q || tech || stage) && (
          <button
            onClick={() => { setQ(""); setTech(""); setStage(""); }}
            className="text-slate-400 hover:text-white text-sm"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500 mb-2">No projects found</p>
          <Link href="/project/new" className="btn-primary text-sm">Create one</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const isMember = p.members.length > 0;
            const pendingRequest = p.joinRequests.find((r) => r.status === "PENDING");
            const rejectedRequest = p.joinRequests.find((r) => r.status === "REJECTED");

            const rejectedCooldownDays = 30;
            const rejectedExpired = rejectedRequest
              ? Date.now() - new Date(rejectedRequest.updatedAt).getTime() >= rejectedCooldownDays * 24 * 60 * 60 * 1000
              : false;
            const rejectedDaysLeft = rejectedRequest
              ? Math.max(
                  0,
                  Math.ceil(
                    (rejectedCooldownDays * 24 * 60 * 60 * 1000 -
                      (Date.now() - new Date(rejectedRequest.updatedAt).getTime())) /
                      (24 * 60 * 60 * 1000)
                  )
                )
              : 0;
            const canReopenRejected = rejectedRequest && rejectedExpired;
            const hasRecentRejected = rejectedRequest && !rejectedExpired;
            const buttonLabel = isMember
              ? "Member"
              : pendingRequest
              ? "Withdraw"
              : hasRecentRejected
              ? `Rejected (${rejectedDaysLeft}d)`
              : canReopenRejected
              ? "Request again"
              : "Join";
            const isActionDisabled = requesting.has(p.id) || isMember || hasRecentRejected;
            const actionHandler = pendingRequest
              ? () => handleWithdraw(p.id, pendingRequest.id)
              : () => handleJoin(p.id);

            return (
              <div key={p.id} className="card p-5 flex flex-col hover:border-brand-600/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link href={`/project/${p.id}`} className="text-white font-semibold hover:text-brand-300 transition-colors">
                    {p.name}
                  </Link>
                  <span className="badge bg-brand-900/50 text-brand-300 shrink-0 text-xs">
                    {STAGE_LABELS[p.stage] ?? p.stage}
                  </span>
                </div>

                <p className="text-slate-400 text-sm line-clamp-2 mb-3 flex-1">{p.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.techStack.slice(0, 3).map((t) => (
                    <span key={t} className="badge bg-surface-soft text-slate-300 text-xs">{t}</span>
                  ))}
                  {p.techStack.length > 3 && (
                    <span className="badge bg-surface-soft text-slate-500 text-xs">+{p.techStack.length - 3}</span>
                  )}
                </div>

                <div className="text-slate-500 text-xs mb-4">
                  {p._count.members} member{p._count.members !== 1 ? "s" : ""} · {p._count.tasks} task{p._count.tasks !== 1 ? "s" : ""}
                </div>

                {rejectedRequest && !rejectedExpired && (
                  <div className="mb-3">
                    <span className="badge bg-red-900/30 text-red-300 text-xs">
                      Rejected · retry in {rejectedDaysLeft} day{rejectedDaysLeft === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Link href={`/project/${p.id}`} className="btn-secondary text-xs py-1.5 flex-1 text-center">
                    View
                  </Link>
                  {!isMember && (
                    <button
                      onClick={actionHandler}
                      disabled={isActionDisabled}
                      className="btn-primary text-xs py-1.5 flex-1 disabled:opacity-50"
                    >
                      {requesting.has(p.id) ? "…" : buttonLabel}
                    </button>
                  )}
                  {isMember && (
                    <span className="flex-1 text-center text-xs py-1.5 text-green-400 font-medium">
                      ✓ Member
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
