// src/app/api/auth/signup/route.ts
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { signupSchema } from "@/lib/validators";
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
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { name, username, email, password, age } = parsed.data;

    // Check for existing user — two separate queries for clear error messages
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      return errorResponse("An account with this email already exists.", 409);
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (existingUsername) {
      return errorResponse("This username is already taken.", 409);
    }

    // Hash password with cost factor 12 (good balance of security and speed)
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, username, email, password: hashedPassword, age },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        profilePicture: true,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const response = successResponse({ user }, 201);
    response.cookies.set(AUTH_COOKIE, token, AUTH_COOKIE_OPTIONS);
    return response;
  });
}
