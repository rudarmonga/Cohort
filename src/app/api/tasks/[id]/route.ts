// src/app/api/tasks/[id]/route.ts
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validators";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

async function getTaskAndMembership(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { task: null, membership: null };

  const membership = await prisma.projectUser.findUnique({
    where: {
      userId_projectId: { userId, projectId: task.projectId },
    },
  });

  return { task, membership };
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { id } = await params;
    const { task, membership } = await getTaskAndMembership(id, currentUser.userId);

    if (!task) return errorResponse("Task not found", 404);
    if (!membership) return errorResponse("You must be a project member to update tasks", 403);

    const body = await req.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const isManager = membership.role === "OWNER" || membership.role === "ADMIN";

    if (!isManager) {
      const updateKeys = Object.keys(parsed.data).filter((key) => parsed.data[key as keyof typeof parsed.data] !== undefined);
      const onlyStatus = updateKeys.every((key) => key === "status");
      if (!onlyStatus) {
        return errorResponse(
          "Only project owners and admins can change task details or assignment",
          403
        );
      }
    }

    // Validate assignee if provided
    if (parsed.data.assigneeId) {
      const assigneeMembership = await prisma.projectUser.findUnique({
        where: {
          userId_projectId: {
            userId: parsed.data.assigneeId,
            projectId: task.projectId,
          },
        },
      });
      if (!assigneeMembership) {
        return errorResponse("Assignee must be a project member", 400);
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: parsed.data,
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

    return successResponse({ task: updated });
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { id } = await params;
    const { task, membership } = await getTaskAndMembership(id, currentUser.userId);

    if (!task) return errorResponse("Task not found", 404);
    if (!membership) return errorResponse("You must be a project member to delete tasks", 403);

    // Only owners and admins can delete tasks
    if (!["OWNER", "ADMIN"].includes(membership.role)) {
      return errorResponse("Only owners and admins can delete tasks", 403);
    }

    await prisma.task.delete({ where: { id } });
    return successResponse({ message: "Task deleted" });
  });
}
