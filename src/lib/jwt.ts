// src/lib/jwt.ts
import type { JWTPayload } from "jose";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export interface JwtPayload extends JWTPayload {
  userId: string;
  email: string;
  username: string;
}

/**
 * Sign a JWT token with 7-day expiry.
 * Uses jose which is edge-runtime compatible.
 */
export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * Verify and decode a JWT token.
 * Returns null instead of throwing to simplify callers.
 */
export async function verifyToken(
  token: string
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
