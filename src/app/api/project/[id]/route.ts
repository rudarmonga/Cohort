// src/app/api/project/[id]/route.ts
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProjectSchema } from "@/lib/validators";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

const userSelect = {
  select: {
    id: true,
    name: true,
    username: true,
    email: true,
    profilePicture: true,
  },
};

async function getProjectMembership(projectId: string, userId: string) {
  return prisma.projectUser.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
}

export async function GET(_req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { id } = await params;
    const membership = await getProjectMembership(id, currentUser.userId);

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: userSelect,
        members: {
          include: { user: userSelect },
          orderBy: { joinedAt: "asc" },
        },
        tasks: {
          include: { assignee: userSelect },
          orderBy: { createdAt: "asc" },
        },
        ...(membership && ["OWNER", "ADMIN"].includes(membership.role)
          ? {
              joinRequests: {
                where: { status: { in: ["PENDING", "REJECTED"] } },
                include: { user: userSelect },
                orderBy: { createdAt: "desc" },
              },
            }
          : {}),
        _count: { select: { tasks: true, members: true } },
      },
    });

    if (!project) return errorResponse("Project not found", 404);

    return successResponse({ project });
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { id } = await params;
    const membership = await getProjectMembership(id, currentUser.userId);

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return errorResponse("Only project owners and admins can update projects", 403);
    }

    const body = await req.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const project = await prisma.project.update({
      where: { id },
      data: parsed.data,
      include: {
        createdBy: userSelect,
        members: { include: { user: userSelect } },
      },
    });

    return successResponse({ project });
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { id } = await params;
    const membership = await getProjectMembership(id, currentUser.userId);

    // Only the OWNER can delete a project
    if (!membership || membership.role !== "OWNER") {
      return errorResponse("Only the project owner can delete this project", 403);
    }

    await prisma.project.delete({ where: { id } });

    return successResponse({ message: "Project deleted successfully" });
  });
}
