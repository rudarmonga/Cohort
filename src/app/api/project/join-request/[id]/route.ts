// src/app/api/project/join-request/[id]/route.ts
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { joinRequestStatusSchema } from "@/lib/validators";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { id } = await params;

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { userId: currentUser.userId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!joinRequest) return errorResponse("Join request not found", 404);

    // Only OWNER or ADMIN of the project can accept/reject
    const requesterMembership = joinRequest.project.members[0];
    if (
      !requesterMembership ||
      !["OWNER", "ADMIN"].includes(requesterMembership.role)
    ) {
      return errorResponse(
        "Only project owners and admins can manage join requests",
        403
      );
    }

    if (joinRequest.status === "ACCEPTED") {
      return errorResponse("This request has already been accepted", 409);
    }

    const body = await req.json();
    const parsed = joinRequestStatusSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { status } = parsed.data;

    // Use a transaction: update request + create membership atomically
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.joinRequest.update({
        where: { id },
        data: { status },
      });

      if (status === "ACCEPTED") {
        const existingMember = await tx.projectUser.findUnique({
          where: {
            userId_projectId: {
              userId: joinRequest.userId,
              projectId: joinRequest.projectId,
            },
          },
        });

        if (!existingMember) {
          await tx.projectUser.create({
            data: {
              userId: joinRequest.userId,
              projectId: joinRequest.projectId,
              role: "MEMBER",
            },
          });
        }
      }

      return updated;
    });

    return successResponse({ joinRequest: result });
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { id } = await params;

    const joinRequest = await prisma.joinRequest.findUnique({ where: { id } });
    if (!joinRequest) return errorResponse("Join request not found", 404);
    if (joinRequest.userId !== currentUser.userId) {
      return errorResponse("Only the request owner can withdraw this join request", 403);
    }
    if (joinRequest.status !== "PENDING") {
      return errorResponse("Only pending requests can be withdrawn", 409);
    }

    await prisma.joinRequest.delete({ where: { id } });
    return successResponse({ message: "Join request withdrawn" });
  });
}
