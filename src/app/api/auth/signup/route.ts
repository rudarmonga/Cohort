import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { signToken } from "@/lib/jwt";
import { sendSuccess } from "@/lib/responseHandler";
import { signupSchema } from "@/lib/validators/auth.schema";
import { handleError } from "@/lib/errorHandler";
import { AppError } from "@/lib/AppError";

const AUTH_COOKIE_NAME = "jwt";

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

    const { name, email, password, age, userName } = parsedBody.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { projectUsers: true },
    });

    if (existingUser && !existingUser.deletedAt) {
      throw new AppError(
        "Email already registered",
        400,
        "VALIDATION_ERROR"
      );
    }

    let user;

    if (existingUser && existingUser.deletedAt) {
      user = await prisma.user.update({
        where: { email },
        data: {
          name,
          userName,
          age,
          password: await hashPassword(password),
          deletedAt: null,
        },
        include: { projectUsers: true },
      });
    } 
    else {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: await hashPassword(password),
          age,
          userName,
        },
        include: { 
          projectUsers: {
            include : {
              project : true,
            }
          }
        },
      });
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
    });

    const { password: _, ...safeUser } = user;

    const response = sendSuccess(
      { user: safeUser },
      existingUser && existingUser.deletedAt
        ? "Account restored successfully"
        : "User created successfully",
      existingUser && existingUser.deletedAt ? 200 : 201
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
      "POST /api/auth/signup"
    );
  }
}
