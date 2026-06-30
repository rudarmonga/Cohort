// src/app/api/project/transfer-ownership/[id]/route.ts
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

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  newOwnerId: z.string().cuid("Invalid user ID"),
});

export async function POST(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { id: projectId } = await params;

    // Verify current user is OWNER
    const ownerMembership = await prisma.projectUser.findUnique({
      where: {
        userId_projectId: { userId: currentUser.userId, projectId },
      },
    });

    if (!ownerMembership || ownerMembership.role !== "OWNER") {
      return errorResponse("Only the project owner can transfer ownership", 403);
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { newOwnerId } = parsed.data;

    if (newOwnerId === currentUser.userId) {
      return errorResponse("You are already the owner", 400);
    }

    // Verify new owner is a project member
    const newOwnerMembership = await prisma.projectUser.findUnique({
      where: {
        userId_projectId: { userId: newOwnerId, projectId },
      },
    });

    if (!newOwnerMembership) {
      return errorResponse("The new owner must already be a project member", 400);
    }

    // Atomically swap roles
    await prisma.$transaction([
      prisma.projectUser.update({
        where: { userId_projectId: { userId: currentUser.userId, projectId } },
        data: { role: "MEMBER" },
      }),
      prisma.projectUser.update({
        where: { userId_projectId: { userId: newOwnerId, projectId } },
        data: { role: "OWNER" },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { createdById: newOwnerId },
      }),
    ]);

    return successResponse({ message: "Ownership transferred successfully" });
  });
}
