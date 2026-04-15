import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { updateUserSchema } from "@/lib/validators/user.schema";
import { handleError } from "@/lib/errorHandler";
import { AppError } from "@/lib/AppError";
import { comparePassword } from "@/lib/hash";
import { Prisma } from "@prisma/client";

function handlePrismaError(error: any) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      
      const field = Array.isArray(error.meta?.target)
        ? error.meta.target[0]
        : undefined;

      const fieldMessages: Record<string, string> = {
        userName: "Username already taken",
        email: "Email already in use",
      };

      return sendError(
        fieldMessages[field || ""] || `${field || "Username"} already exists`,
        "UNIQUE_CONSTRAINT",
        400
      );
    }
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const userIdHeader = request.headers.get("x-user-id");

    if (!userIdHeader) {
      return sendError("Authentication required", "AUTH_ERROR", 401);
    }

    const userId = Number(userIdHeader);

    if (!Number.isInteger(userId)) {
      return sendError("Invalid user id", "VALIDATION_ERROR", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projectUsers: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!user) {
      return sendError("User not found", "NOT_FOUND", 404);
    }

    const { password, ...safeUser } = user;

    return sendSuccess(safeUser, "Current user fetched successfully");


  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "GET /api/user"
    );
  }
}

export async function PUT(request: Request) {
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
    const parsedBody = updateUserSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message || "Invalid input",
        400,
        "VALIDATION_ERROR",
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: parsedBody.data,
      include: {
        projectUsers: {
          include: {
            project: true,
          },
        },
      },
    });

    const { password, ...safeUser } = user;

    return sendSuccess(safeUser, "User updated successfully", 200);
  } catch (error) {
    const prismaHandled = handlePrismaError(error);
    if (prismaHandled) return prismaHandled;
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "PUT /api/user"
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userIdHeader = request.headers.get("x-user-id");

    if (!userIdHeader) {
      return sendError("Authentication required", "AUTH_ERROR", 401);
    }

    const userId = Number(userIdHeader);

    if (!Number.isInteger(userId)) {
      return sendError("Invalid user id", "VALIDATION_ERROR", 400);
    }

    const { password } = await request.json();

    if (!password) {
      return sendError("Password required", "VALIDATION_ERROR", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      return sendError("User not found", "NOT_FOUND", 404);
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return sendError("Wrong Password", "VALIDATION_ERROR", 400);
    }

    await prisma.$transaction(async (tx) => {
      const adminProjects = await tx.projectUser.findMany({
        where: {
          userId,
          role: "ADMIN",
        },
      });

      for (const membership of adminProjects) {
        const teammates = await tx.projectUser.findMany({
          where: {
            projectId: membership.projectId,
            NOT: { userId },
            user: { deletedAt: null },
          },
        });

        if (teammates.length === 0) {
          throw new AppError(
            "Cannot delete user. They are the sole admin of a project.",
            400,
            "BUSINESS_LOGIC"
          );
        }

        const random =
          teammates[Math.floor(Math.random() * teammates.length)];

        await tx.projectUser.update({
          where: { id: random.id },
          data: { role: "ADMIN" },
        });

        await tx.projectUser.update({
          where: { id: membership.id },
          data: { role: "MEMBER" },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });
    });

    const { password: _, ...safeUser } = user;

    return sendSuccess(safeUser, "User deleted successfully", 200);
  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "DELETE /api/user"
    );
  }
}