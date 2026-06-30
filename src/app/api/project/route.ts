// src/app/api/project/route.ts
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validators";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-response";

const memberSelect = {
  id: true,
  role: true,
  joinedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      profilePicture: true,
    },
  },
};

export async function GET() {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const projects = await prisma.project.findMany({
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
        members: { select: memberSelect },
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ projects });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return errorResponse("Authentication required", 401);

    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { name, description, techStack, stage, lookingFor } = parsed.data;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        techStack,
        stage,
        lookingFor,
        createdById: currentUser.userId,
        members: {
          create: {
            userId: currentUser.userId,
            role: "OWNER",
          },
        },
      },
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
        members: { select: memberSelect },
      },
    });

    return successResponse({ project }, 201);
  });
}
