import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { handleError } from "@/lib/errorHandler";
import { AppError } from "@/lib/AppError";
import { ProjectSchema } from "@/lib/validators/project.schema";
import { ProjectRole } from "@prisma/client";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
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

    return sendSuccess(
      projects,
      "All projects fetched successfully"
    );
  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "GET /api/project"
    );
  }
}

export async function POST(request: Request) {
  try {
    const userIdHeader = request.headers.get("x-user-id");

    if (!userIdHeader) {
      return sendError("Authentication required", "AUTH_ERROR", 401);
    }

    const userId = Number(userIdHeader);

    if (!Number.isInteger(userId)) {
      return sendError("Invalid user id", "VALIDATION_ERROR", 400);
    }

    const body = await request.json();
    const parsedBody = ProjectSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message || "Invalid input",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { name, description } = parsedBody.data;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        users: {
          create: {
            userId,
            role: ProjectRole.ADMIN,
          },
        },
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

    return sendSuccess(
      project,
      "Project created successfully",
      201
    );

  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "POST /api/project"
    );
  }
}
