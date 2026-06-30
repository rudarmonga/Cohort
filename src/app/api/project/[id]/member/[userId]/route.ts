// src/app/api/project/[id]/member/[userId]/route.ts
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  withErrorHandling,
} from "@/lib/api-response";

type Params = { params: Promise<{ id: string; userId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { id: projectId, userId: targetUserId } = await params;
    const body = await req.json().catch(() => ({}));
    const requestedRole = body.role;

    if (requestedRole !== "ADMIN" && requestedRole !== "MEMBER") {
      return errorResponse("Invalid role", 400);
    }

    const requesterMembership = await prisma.projectUser.findUnique({
      where: {
        userId_projectId: { userId: currentUser.userId, projectId },
      },
    });

    if (
      !requesterMembership ||
      !["OWNER", "ADMIN"].includes(requesterMembership.role)
    ) {
      return errorResponse("Only owners and admins can change roles", 403);
    }

    const targetMembership = await prisma.projectUser.findUnique({
      where: {
        userId_projectId: { userId: targetUserId, projectId },
      },
    });

    if (!targetMembership) {
      return errorResponse("User is not a member of this project", 404);
    }

    if (targetMembership.role === "OWNER") {
      return errorResponse("The project owner role cannot be changed", 400);
    }

    if (requesterMembership.role === "ADMIN") {
      if (targetMembership.role !== "MEMBER" || requestedRole !== "ADMIN") {
        return errorResponse("Admins can only promote regular members to admin", 403);
      }
    }

    await prisma.projectUser.update({
      where: {
        userId_projectId: { userId: targetUserId, projectId },
      },
      data: { role: requestedRole },
    });

    return successResponse({ message: "Member role updated successfully" });
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { id: projectId, userId: targetUserId } = await params;

    // Get the requester's membership
    const requesterMembership = await prisma.projectUser.findUnique({
      where: {
        userId_projectId: { userId: currentUser.userId, projectId },
      },
    });

    if (
      !requesterMembership ||
      !["OWNER", "ADMIN"].includes(requesterMembership.role)
    ) {
      return errorResponse("Only owners and admins can remove members", 403);
    }

    // Get the target member's membership
    const targetMembership = await prisma.projectUser.findUnique({
      where: {
        userId_projectId: { userId: targetUserId, projectId },
      },
    });

    if (!targetMembership) {
      return errorResponse("User is not a member of this project", 404);
    }

    // Admins cannot remove owners or other admins
    if (
      requesterMembership.role === "ADMIN" &&
      targetMembership.role !== "MEMBER"
    ) {
      return errorResponse("Admins can only remove regular members", 403);
    }

    // Owner cannot be removed (must transfer ownership first)
    if (targetMembership.role === "OWNER") {
      return errorResponse(
        "The project owner cannot be removed. Transfer ownership first.",
        400
      );
    }

    await prisma.projectUser.delete({
      where: {
        userId_projectId: { userId: targetUserId, projectId },
      },
    });

    return successResponse({ message: "Member removed successfully" });
  });
}
