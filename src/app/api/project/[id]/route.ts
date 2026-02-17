import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { handleError } from "@/lib/errorHandler";
import { AppError } from "@/lib/AppError";
import { updateProjectSchema } from "@/lib/validators/project.schema";
import { ProjectRole } from "@prisma/client";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const projectId = Number(id);

    if (!Number.isInteger(projectId)) {
      return sendError("Invalid project id", "VALIDATION_ERROR", 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        users: {
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
        },
        tasks: true,
      },
    });

    if (!project) {
      return sendError("Project not found", "NOT_FOUND", 404);
    }

    return sendSuccess(project, "Project fetched successfully");
  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "GET /api/project/[id]"
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

    const userId = Number(userIdHeader);
    if (!Number.isInteger(userId)) {
      return sendError("Invalid user id", "VALIDATION_ERROR", 400);
    }

    const { id } = await context.params;
    const projectId = Number(id);

    if (!Number.isInteger(projectId)) {
      return sendError("Invalid project id", "VALIDATION_ERROR", 400);
    }

    const body = await request.json();
    const parsedBody = updateProjectSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message || "Invalid input",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { name, description } = parsedBody.data;

    const membership = await prisma.projectUser.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      return sendError("Access denied", "FORBIDDEN", 403);
    }

    if (membership.role !== ProjectRole.ADMIN) {
      return sendError("Only admin can update project", "FORBIDDEN", 403);
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
      include: {
        users: {
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
        },
        tasks: true,
      },
    });

    return sendSuccess(project, "Project updated successfully");

  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "PUT /api/project/[id]"
    );
  }
}
