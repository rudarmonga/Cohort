// src/app/api/project/leave/[id]/route.ts
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  withErrorHandling,
} from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { id: projectId } = await params;

    const membership = await prisma.projectUser.findUnique({
      where: {
        userId_projectId: { userId: currentUser.userId, projectId },
      },
    });

    if (!membership) return errorResponse("You are not a member of this project", 404);

    // Owner must transfer ownership before leaving
    if (membership.role === "OWNER") {
      return errorResponse(
        "Project owners cannot leave. Transfer ownership first or delete the project.",
        400
      );
    }

    await prisma.projectUser.delete({
      where: {
        userId_projectId: { userId: currentUser.userId, projectId },
      },
    });

    return successResponse({ message: "You have left the project" });
  });
}
