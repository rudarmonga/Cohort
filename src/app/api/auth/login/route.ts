import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/hash";
import { signToken } from "@/lib/jwt";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { loginSchema } from "@/lib/validators/auth.schema";
import { handleError } from "@/lib/errorHandler";
import { AppError } from "@/lib/AppError";

const AUTH_COOKIE_NAME = "jwt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = loginSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message || "Invalid input",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { email, password } = parsedBody.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        projectUsers: {
          include: {
            project : true,
          }
        }
      },
    });

    if (!user || !user.password) {
      return sendError("Invalid credentials", "AUTH_ERROR", 401);
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return sendError("Invalid credentials", "AUTH_ERROR", 401);
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
    });

    const { password: _, ...safeUser } = user;

    const response = sendSuccess(
      {
        user: safeUser,
      },
      "Login successful"
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error("Unknown error"),
      "POST /api/auth/login"
    );
  }
}
