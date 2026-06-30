// src/app/auth/signup/page.tsx
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { signupSchema, SignupInput } from "@/lib/validators";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/authSlice";

export default function SignupPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupInput) {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Signup failed");
        return;
      }

      dispatch(setUser(json.data.user));
      toast.success("Account created!");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="card p-8 animate-slide-up">
      <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
      <p className="text-slate-400 text-sm mb-6">Join COHORT and start collaborating</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Full name</label>
            <input
              {...register("name")}
              className="input"
              placeholder="Jane Doe"
              autoComplete="name"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="label">Username</label>
            <input
              {...register("username")}
              className="input"
              placeholder="janedoe"
              autoComplete="username"
            />
            {errors.username && (
              <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>
            )}
          </div>
        </div>

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
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            autoComplete="new-password"
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-6">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 transition-colors">
          Log in
        </Link>
      </p>
    </div>
  );
}
