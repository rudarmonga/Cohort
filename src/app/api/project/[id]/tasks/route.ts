// src/app/api/project/[id]/tasks/route.ts
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validators";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { id: projectId } = await params;

    // Only owners and admins can create tasks
    const membership = await prisma.projectUser.findUnique({
      where: {
        userId_projectId: { userId: currentUser.userId, projectId },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return errorResponse("Only project owners and admins can create tasks", 403);
    }

    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { title, description, status, assigneeId } = parsed.data;

    // Validate assignee is a project member if provided
    if (assigneeId) {
      const assigneeMembership = await prisma.projectUser.findUnique({
        where: {
          userId_projectId: { userId: assigneeId, projectId },
        },
      });
      if (!assigneeMembership) {
        return errorResponse("Assignee must be a project member", 400);
      }
    }

    const task = await prisma.task.create({
      data: { title, description, status: status ?? "TODO", projectId, assigneeId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    return successResponse({ task }, 201);
  });
}
