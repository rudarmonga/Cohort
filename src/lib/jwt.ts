import { SignJWT, jwtVerify, JWTPayload } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export type AuthTokenPayload = {
  userId: number;
  email: string;
};

export async function signToken(payload: AuthTokenPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(
  token: string
): Promise<(JWTPayload & AuthTokenPayload) | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload & AuthTokenPayload;
  } catch {
    return null;
  }
}
