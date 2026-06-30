// src/app/page.tsx
import Link from "next/link";

const features = [
  {
    icon: "🚀",
    title: "Create Projects",
    desc: "Describe your idea, your tech stack, and the kind of people you're looking for.",
  },
  {
    icon: "🔍",
    title: "Discover & Join",
    desc: "Browse projects by technology or stage. Send a join request in one click.",
  },
  {
    icon: "✅",
    title: "Manage Tasks",
    desc: "Drag tasks between TODO, IN PROGRESS, and DONE on a shared kanban board.",
  },
  {
    icon: "👥",
    title: "Role-Based Teams",
    desc: "Owners, Admins, and Members with clear permissions at every level.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-surface-border bg-surface-soft/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="font-semibold text-white text-lg tracking-tight">COHORT</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-slate-400 hover:text-white text-sm transition-colors">Log in</Link>
            <Link href="/auth/signup" className="btn-primary text-sm py-1.5">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-950/60 border border-brand-800/50 rounded-full px-4 py-1.5 text-brand-300 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            Build better, together
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6 tracking-tight">
            Find your team.
            <br />
            <span className="text-brand-400">Ship your idea.</span>
          </h1>

          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            COHORT is the workspace for side projects, startups, and student teams. Create a project, discover collaborators, and track everything in one place.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/signup" className="btn-primary text-base px-6 py-3">
              Start for free
            </Link>
            <Link href="/auth/login" className="btn-secondary text-base px-6 py-3">
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-surface-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-semibold text-white mb-12">
            Everything your team needs
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-white font-medium mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-border py-8 text-center text-slate-600 text-sm">
        COHORT — Built for builders.
      </footer>
    </main>
  );
}
