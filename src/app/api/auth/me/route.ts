import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  withErrorHandling,
} from "@/lib/api-response";

export async function GET() {
  return withErrorHandling(async () => {
    const payload = await getCurrentUser();

    if (!payload) {
      return errorResponse("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        profilePicture: true,
      },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse({ user });
  });
}