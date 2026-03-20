import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { handleError } from "@/lib/errorHandler";
import { ProjectUserSchema, updateProjectUserSchema, deleteProjectUserSchema } from "@/lib/validators/project.schema";
import { ProjectRole } from "@prisma/client";
import { AppError } from "@/lib/AppError";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userIdHeader = request.headers.get("x-user-id");
    if (!userIdHeader) {
      return sendError("Authentication required", "AUTH_ERROR", 401);
    }

    const currentUserId = Number(userIdHeader);
    if (!Number.isInteger(currentUserId)) {
      return sendError("Invalid user id", "VALIDATION_ERROR", 400);
    }

    const { id } = await context.params;
    const projectId = Number(id);

    if (!Number.isInteger(projectId)) {
      return sendError("Invalid project id", "VALIDATION_ERROR", 400);
    }

    const body = await request.json();
    const parsedBody = ProjectUserSchema.safeParse({
      ...body,
      projectId,
    });

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message || "Invalid input",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { userId, role } = parsedBody.data;

    const membership = await prisma.projectUser.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: currentUserId,
        },
      },
    });

    if (!membership || membership.role !== ProjectRole.ADMIN) {
      return sendError(
        "Only admin can add team members",
        "FORBIDDEN",
        403
      );
    }

    const existingMember = await prisma.projectUser.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existingMember) {
      return sendError(
        "User is already part of this project",
        "CONFLICT",
        409
      );
    }
    const newMember = await prisma.projectUser.create({
      data: {
        projectId,
        userId,
        role: role ?? ProjectRole.MEMBER,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userName: true,
          },
        },
      },
    });

    return sendSuccess(newMember, "Team member added successfully", 201);

  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "POST /api/project/users/[id]"
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userIdHeader = request.headers.get("x-user-id");
    if (!userIdHeader) {
      return sendError("Authentication required", "AUTH_ERROR", 401);
    }

    const adminId = Number(userIdHeader);
    if (!Number.isInteger(adminId)) {
      return sendError("Invalid user id", "VALIDATION_ERROR", 400);
    }

    const { id } = await context.params;
    const projectId = Number(id);

    if (!Number.isInteger(projectId)) {
      return sendError("Invalid project id", "VALIDATION_ERROR", 400);
    }

    const body = await request.json();
    const parsedBody = updateProjectUserSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message || "Invalid input",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { userId, role } = parsedBody.data;

    const adminMembership = await prisma.projectUser.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: adminId,
        },
      },
    });

    if (!adminMembership || adminMembership.role !== ProjectRole.ADMIN) {
      return sendError("Only admin can update members", "FORBIDDEN", 403);
    }

    const existingMember = await prisma.projectUser.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!existingMember) {
      return sendError("Project member not found", "NOT_FOUND", 404);
    }

    if (existingMember.role === role) {
      return sendSuccess(
        existingMember,
        "Project user already has this role"
      );
    }

    const updatedMember = await prisma.projectUser.update({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      data: {
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userName: true,
          },
        },
      },
    });

    return sendSuccess(updatedMember, "Project user role updated successfully");

  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "PUT /api/project/users/[id]"
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userIdHeader = request.headers.get("x-user-id");
    if (!userIdHeader) {
      return sendError("Authentication required", "AUTH_ERROR", 401);
    }

    const adminId = Number(userIdHeader);
    if (!Number.isInteger(adminId)) {
      return sendError("Invalid user id", "VALIDATION_ERROR", 400);
    }

    const { id } = await context.params;
    const projectId = Number(id);

    if (!Number.isInteger(projectId)) {
      return sendError("Invalid project id", "VALIDATION_ERROR", 400);
    }

    const body = await request.json();
    const parsedBody = deleteProjectUserSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message || "Invalid input",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { userId } = parsedBody.data;

    const adminMembership = await prisma.projectUser.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: adminId,
        },
      },
    });

    if (!adminMembership || adminMembership.role !== ProjectRole.ADMIN) {
      return sendError("Only admin can removed members", "FORBIDDEN", 403);
    }

    const existingMember = await prisma.projectUser.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!existingMember) {
      return sendError("Project member not found", "NOT_FOUND", 404);
    }

    if (userId === adminId) {
      return sendError(
        "Admin cannot remove themselves from project",
        "FORBIDDEN",
        403
      );
}

    const deleteMember = await prisma.projectUser.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userName: true,
          },
        },
      },
    });

    return sendSuccess(deleteMember, "Project user role removed successfully");

  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "DELETE /api/project/users/[id]"
    );
  }
}