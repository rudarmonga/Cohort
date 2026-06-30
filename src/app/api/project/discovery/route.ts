// src/app/api/project/discovery/route.ts
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, withErrorHandling } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("q")?.trim();
    const tech = searchParams.get("tech")?.trim();
    const stage = searchParams.get("stage")?.trim();

    const where: Prisma.ProjectWhereInput = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ];
    }

    if (tech) {
      where.techStack = { has: tech };
    }

    if (stage) {
      where.stage = stage as Prisma.EnumStageFilter["equals"];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            profilePicture: true,
          },
        },
        _count: { select: { tasks: true, members: true } },
        // Check if current user already has a request or membership
        joinRequests: {
          where: { userId: currentUser.userId },
          select: { id: true, status: true, updatedAt: true },
        },
        members: {
          where: { userId: currentUser.userId },
          select: { id: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ projects });
  });
}
