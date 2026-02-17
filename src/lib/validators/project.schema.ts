import { z } from "zod";

export const ProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(40, "Description must be at least 40 characters").max(400, "Description must be under 400 characters"),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().min(40, "Description must be at least 40 characters").max(400, "Description must be under 400 characters").optional(),
});