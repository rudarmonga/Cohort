import { z } from "zod";

export const ProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(40, "Description must be at least 40 characters").max(400, "Description must be under 400 characters"),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().min(40, "Description must be at least 40 characters").max(400, "Description must be under 400 characters").optional(),
});

export const ProjectUserSchema = z.object({
  projectId: z.number(),
  userId: z.number(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
});

export const updateProjectUserSchema = z.object({
  userId: z.number(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const deleteProjectUserSchema = z.object({
  userId: z.number()
});