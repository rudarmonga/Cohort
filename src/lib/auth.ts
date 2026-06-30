// src/lib/auth.ts
import { cookies } from "next/headers";
import { verifyToken, JwtPayload } from "./jwt";

/**
 * Extract and verify the auth token from the request cookies.
 * Returns the decoded payload or null if unauthenticated.
 */
export async function getCurrentUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cohort_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Cookie name used for the auth token.
 */
export const AUTH_COOKIE = "cohort_token";

/**
 * Shared cookie options for secure auth token storage.
 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,         // JS cannot read the cookie
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};
