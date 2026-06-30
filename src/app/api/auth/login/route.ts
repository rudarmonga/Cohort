// src/app/api/auth/login/route.ts
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { loginSchema } from "@/lib/validators";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-response";
import { AUTH_COOKIE, AUTH_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        password: true,
        profilePicture: true,
      },
    });

    // Use a constant-time comparison even when user is not found
    // to prevent timing-based user enumeration attacks
    const dummyHash =
      "$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const passwordToCompare = user?.password ?? dummyHash;
    const isValid = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isValid) {
      // Return same error regardless of whether email or password was wrong
      return errorResponse("Invalid email or password.", 401);
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const { password: _, ...safeUser } = user;

    const response = successResponse({ user: safeUser });
    response.cookies.set(AUTH_COOKIE, token, AUTH_COOKIE_OPTIONS);
    return response;
  });
}

export async function DELETE() {
  // Logout — clear the auth cookie
  const response = successResponse({ message: "Logged out successfully" });
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
