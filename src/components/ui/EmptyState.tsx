// src/components/ui/EmptyState.tsx
import Link from "next/link";

interface Props {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon = "📭", title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-white font-medium mb-2">{title}</h3>
      {description && <p className="text-slate-500 text-sm mb-6 max-w-xs">{description}</p>}
      {action &&
        (action.href ? (
          <Link href={action.href} className="btn-primary text-sm">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="btn-primary text-sm">
            {action.label}
          </button>
        ))}
    </div>
  );
}
