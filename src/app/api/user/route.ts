import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { updateUserSchema } from "@/lib/validators/user.schema";
import { handleError } from "@/lib/errorHandler";
import { AppError } from "@/lib/AppError";
import { comparePassword } from "@/lib/hash";

export async function GET( request: Request ) {
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
        projectUsers: true,
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

export async function PUT( request: Request) {
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
        projectUsers: true,
      },
    });

    if (!user) {
      return sendError("User not found", "NOT_FOUND", 404);
    }

    const {password, ...safeUser} = user;

    return sendSuccess(
      safeUser, 
      "User updated successfully",
      200,
    );
  } catch (error) {
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
  // 1️⃣ Find projects where user is ADMIN
  const adminProjects = await tx.projectUser.findMany({
    where: {
      userId,
      role: "ADMIN",
    },
  });

  for (const membership of adminProjects) {
    // 2️⃣ Find active teammates
    const teammates = await tx.projectUser.findMany({
      where: {
        projectId: membership.projectId,
        NOT: { userId },
        user: {
          deletedAt: null,
        },
      },
    });

    if (teammates.length === 0) {
      throw new Error(
        "Cannot delete user. They are the sole admin of a project."
      );
    }

    // 3️⃣ Promote random teammate
    const random =
      teammates[Math.floor(Math.random() * teammates.length)];

    await tx.projectUser.update({
      where: { id: random.id },
      data: { role: "ADMIN" },
    });

    // 4️⃣ Downgrade deleting user to MEMBER
    await tx.projectUser.update({
      where: { id: membership.id },
      data: { role: "MEMBER" },
    });
  }

  // 5️⃣ Soft delete user
  await tx.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });
});


    const { password: _, ...safeUser } = user;

    return sendSuccess(
      safeUser,
      "User deleted successfully",
      200
    );

  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "DELETE /api/user"
    );
  }
}
