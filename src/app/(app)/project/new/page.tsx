// src/app/(app)/project/new/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import toast from "react-hot-toast";
import { createProjectSchema, CreateProjectInput } from "@/lib/validators";

const STAGES = [
  { value: "IDEA", label: "Idea" },
  { value: "PLANNING", label: "Planning" },
  { value: "IN_DEVELOPMENT", label: "In Development" },
  { value: "BETA", label: "Beta" },
  { value: "LAUNCHED", label: "Launched" },
];

function TagInput({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function add() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInput("");
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="input flex-1"
        />
        <button type="button" onClick={add} className="btn-secondary px-3">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span
            key={v}
            className="badge bg-surface-soft text-slate-300 gap-1.5 pr-1"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-slate-500 hover:text-red-400 transition-colors ml-1"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const [techStack, setTechStack] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      stage: "IDEA",
      techStack: [],
      lookingFor: [],
    },
  });

  async function onSubmit(data: CreateProjectInput) {
    const payload = { ...data, techStack, lookingFor };

    // Manually validate arrays since they're controlled outside react-hook-form
    if (techStack.length === 0) {
      setError("techStack" as keyof CreateProjectInput, {
        message: "Add at least one technology",
      });
      return;
    }
    if (lookingFor.length === 0) {
      setError("lookingFor" as keyof CreateProjectInput, {
        message: "Add at least one role",
      });
      return;
    }

    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Project created!");
        router.push(`/project/${json.data.project.id}`);
      } else {
        toast.error(json.error ?? "Failed to create project");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">Create a Project</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="label">Project name</label>
          <input {...register("name")} className="input" placeholder="My Awesome App" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            {...register("description")}
            className="input min-h-[100px] resize-y"
            placeholder="What is this project about? Who is it for?"
          />
          {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <label className="label">Stage</label>
          <select {...register("stage")} className="input">
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <TagInput
          label="Tech stack"
          placeholder="Next.js, TypeScript…"
          values={techStack}
          onChange={(v) => {
            setTechStack(v);
            setValue("techStack", v, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }}
        />
        {errors.techStack && (
          <p className="text-red-400 text-xs -mt-2">{errors.techStack.message}</p>
        )}

        <TagInput
          label="Looking for"
          placeholder="Frontend Developer, Designer…"
          values={lookingFor}
          onChange={(v) => {
            setLookingFor(v);
            setValue("lookingFor", v, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }}
        />
        {errors.lookingFor && (
          <p className="text-red-400 text-xs -mt-2">{errors.lookingFor.message}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary px-6">
            {isSubmitting ? "Creating…" : "Create Project"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
