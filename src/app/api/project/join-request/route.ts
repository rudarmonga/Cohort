// src/app/api/project/join-request/route.ts
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-response";

const schema = z.object({
  projectId: z.string().cuid("Invalid project ID"),
});

const REOPEN_COOLDOWN_DAYS = 30;
const REOPEN_COOLDOWN_MS = REOPEN_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { projectId } = parsed.data;

    // Check project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) return errorResponse("Project not found", 404);

    // Check if already a member
    const existingMember = await prisma.projectUser.findUnique({
      where: {
        userId_projectId: { userId: currentUser.userId, projectId },
      },
    });
    if (existingMember) {
      return errorResponse("You are already a member of this project", 409);
    }

    // Check for existing request for this user/project
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        userId_projectId: { userId: currentUser.userId, projectId },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return errorResponse("You already have a pending request for this project", 409);
      }

      if (existingRequest.status === "ACCEPTED") {
        return errorResponse("You are already a member of this project", 409);
      }

      const rejectedAt = existingRequest.updatedAt.getTime();
      const elapsed = Date.now() - rejectedAt;
      if (elapsed < REOPEN_COOLDOWN_MS) {
        const daysLeft = Math.ceil((REOPEN_COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
        return errorResponse(
          `This request was rejected recently. You can request again in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
          409
        );
      }

      const joinRequest = await prisma.joinRequest.update({
        where: { id: existingRequest.id },
        data: { status: "PENDING" },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      return successResponse({ joinRequest }, 200);
    }

    const joinRequest = await prisma.joinRequest.create({
      data: { userId: currentUser.userId, projectId },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return successResponse({ joinRequest }, 201);
  });
}
