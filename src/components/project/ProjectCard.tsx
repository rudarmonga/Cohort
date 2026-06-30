// src/components/project/ProjectCard.tsx
import Link from "next/link";

const STAGE_LABELS: Record<string, string> = {
  IDEA: "Idea",
  PLANNING: "Planning",
  IN_DEVELOPMENT: "In Dev",
  BETA: "Beta",
  LAUNCHED: "Launched",
};

interface Props {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  stage: string;
  memberCount?: number;
  taskCount?: number;
  actions?: React.ReactNode;
}

export function ProjectCard({
  id,
  name,
  description,
  techStack,
  stage,
  memberCount,
  taskCount,
  actions,
}: Props) {
  return (
    <div className="card p-5 flex flex-col hover:border-brand-600/40 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <Link
          href={`/project/${id}`}
          className="text-white font-semibold hover:text-brand-300 transition-colors leading-tight"
        >
          {name}
        </Link>
        <span className="badge bg-brand-900/50 text-brand-300 text-xs shrink-0">
          {STAGE_LABELS[stage] ?? stage}
        </span>
      </div>

      <p className="text-slate-400 text-sm line-clamp-2 mb-3 flex-1">{description}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {techStack.slice(0, 4).map((t) => (
          <span key={t} className="badge bg-surface-soft text-slate-300 text-xs">
            {t}
          </span>
        ))}
        {techStack.length > 4 && (
          <span className="badge bg-surface-soft text-slate-500 text-xs">
            +{techStack.length - 4}
          </span>
        )}
      </div>

      {(memberCount !== undefined || taskCount !== undefined) && (
        <div className="text-slate-500 text-xs mb-3">
          {memberCount !== undefined && (
            <span>
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
          )}
          {memberCount !== undefined && taskCount !== undefined && (
            <span className="mx-1">·</span>
          )}
          {taskCount !== undefined && (
            <span>
              {taskCount} task{taskCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {actions && <div className="flex gap-2 mt-auto pt-1">{actions}</div>}
    </div>
  );
}
