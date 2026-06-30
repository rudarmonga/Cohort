// src/components/layout/Navbar.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser } from "@/store/authSlice";
import toast from "react-hot-toast";

export function Navbar() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoaded } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/login", { method: "DELETE" });
      dispatch(clearUser());
      toast.success("Logged out");
      router.push("/");
    } catch {
      toast.error("Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <nav className="border-b border-surface-border bg-surface-soft/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            C
          </div>
          <span className="font-semibold text-white text-lg tracking-tight">COHORT</span>
        </Link>

        {isLoaded ? (
          isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">
                Dashboard
              </Link>
              <Link href="/discover" className="text-slate-400 hover:text-white text-sm transition-colors">
                Discover
              </Link>
              <Link href="/project/new" className="btn-primary text-sm py-1.5 px-3">
                New Project
              </Link>
              <div className="flex items-center gap-2 pl-3 border-l border-surface-border">
                <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white text-xs font-medium">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-slate-500 hover:text-red-400 text-sm transition-colors disabled:opacity-50"
                >
                  {isLoggingOut ? "Logging out…" : "Logout"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-slate-400 hover:text-white text-sm">
                Log in
              </Link>
              <Link href="/auth/signup" className="btn-primary text-sm py-1.5">
                Get started
              </Link>
            </div>
          )
        ) : (
          <div className="h-10" />
        )}
      </div>
    </nav>
  );
}
