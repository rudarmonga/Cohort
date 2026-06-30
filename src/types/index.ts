// src/types/index.ts
export type Role = "OWNER" | "ADMIN" | "MEMBER";
export type Stage = "IDEA" | "PLANNING" | "IN_DEVELOPMENT" | "BETA" | "LAUNCHED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type JoinRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface UserSummary {
  id: string;
  name: string;
  username: string;
  email: string;
  profilePicture: string | null;
}

export interface ProjectMember {
  id: string;
  role: Role;
  joinedAt: string;
  user: UserSummary;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  stage: Stage;
  lookingFor: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: UserSummary;
  members: ProjectMember[];
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  projectId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: UserSummary | null;
}

export interface JoinRequest {
  id: string;
  status: JoinRequestStatus;
  createdAt: string;
  user?: UserSummary;
  project?: Pick<Project, "id" | "name">;
}

export interface DashboardData {
  myProjects: Project[];
  assignedTasks: (Task & { project: Pick<Project, "id" | "name"> })[];
  sentRequests: JoinRequest[];
  receivedRequests: JoinRequest[];
  stats: {
    totalProjects: number;
    totalTasks: number;
    doneTasks: number;
    pendingRequests: number;
  };
}
