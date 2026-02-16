import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { signToken } from "@/lib/jwt";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { signupSchema } from "@/lib/validators/auth.schema";
import { handleError } from "@/lib/errorHandler";
import { AppError } from "@/lib/AppError";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = signupSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message || "Invalid input",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { name, email, password, age } = parsedBody.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendError("User already exists", "CONFLICT_ERROR", 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        age,
      },
      include: {
        projectUsers: true,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
    });

    const { password: _, ...safeUser } = user;

    return sendSuccess(
      {
        user: safeUser,
        token,
      },
      "User created successfully",
      201
    );
  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "POST /api/auth/signup"
    );
  }
}
