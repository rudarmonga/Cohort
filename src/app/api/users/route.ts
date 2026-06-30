// src/app/api/users/route.ts
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validators";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-response";
import { AUTH_COOKIE } from "@/lib/auth";

const safeUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  profilePicture: true,
  age: true,
  createdAt: true,
};

export async function GET() {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId, deletedAt: null },
      select: safeUserSelect,
    });

    if (!user) return errorResponse("User not found", 404);
    return successResponse({ user });
  });
}

export async function PUT(req: NextRequest) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    // Check username uniqueness if being changed
    if (parsed.data.username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: parsed.data.username,
          NOT: { id: currentUser.userId },
        },
        select: { id: true },
      });
      if (existing) return errorResponse("Username is already taken", 409);
    }

    const user = await prisma.user.update({
      where: { id: currentUser.userId },
      data: parsed.data,
      select: safeUserSelect,
    });

    return successResponse({ user });
  });
}

export async function DELETE() {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    // Soft delete — preserves data integrity for project/task records
    await prisma.user.update({
      where: { id: currentUser.userId },
      data: { deletedAt: new Date() },
    });

    const response = successResponse({ message: "Account deleted successfully" });
    response.cookies.delete(AUTH_COOKIE);
    return response;
  });
}
