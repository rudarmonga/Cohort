// src/app/api/dashboard/route.ts
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  withErrorHandling,
} from "@/lib/api-response";

export async function GET() {
  return withErrorHandling(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return errorResponse("Authentication required", 401);
    }

    const userId = currentUser.userId;

    const [
      myProjectUsers,
      assignedTasks,
      sentRequests,
      receivedRequests,
    ] = await Promise.all([
      // Projects the user is a member of
      prisma.projectUser.findMany({
        where: { userId },
        include: {
          project: {
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
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                      email: true,
                      profilePicture: true,
                    },
                  },
                },
              },
              _count: { select: { tasks: true, members: true } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      }),

      // Tasks assigned to the user
      prisma.task.findMany({
        where: { assigneeId: userId },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),

      // Join requests sent by the user
      prisma.joinRequest.findMany({
        where: { userId },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Join requests received on the user's projects
      prisma.joinRequest.findMany({
        where: {
          status: { in: ["PENDING", "REJECTED"] },
          project: {
            members: {
              some: {
                userId,
                role: { in: ["OWNER", "ADMIN"] },
              },
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              profilePicture: true,
            },
          },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const myProjects = myProjectUsers.map((pu) => pu.project);
    const doneTasks = assignedTasks.filter((t) => t.status === "DONE").length;
    const pendingRequests = receivedRequests.filter((r) => r.status === "PENDING").length;

    return successResponse({
      myProjects,
      assignedTasks,
      sentRequests,
      receivedRequests,
      stats: {
        totalProjects: myProjects.length,
        totalTasks: assignedTasks.length,
        doneTasks,
        pendingRequests,
      },
    });
  });
}
