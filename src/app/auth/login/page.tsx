// src/app/auth/login/page.tsx
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { loginSchema, LoginInput } from "@/lib/validators";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/authSlice";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Login failed");
        return;
      }

      dispatch(setUser(json.data.user));
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="card p-8 animate-slide-up">
      <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
      <p className="text-slate-400 text-sm mb-6">Log in to your COHORT account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            {...register("email")}
            type="email"
            className="input"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="label">Password</label>
          <input
            {...register("password")}
            type="password"
            className="input"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-2.5 mt-2"
        >
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
