// src/components/ui/Spinner.tsx
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" }[size];
  return (
    <div
      className={`${sizeClass} border-2 border-brand-500 border-t-transparent rounded-full animate-spin`}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner />
    </div>
  );
}
