// src/lib/validators.ts
import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username may only contain letters, numbers, and underscores"
    ),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  age: z.number().int().min(13, "Must be at least 13").max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// ─── Profile ─────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  age: z.number().int().min(13).max(120).optional().nullable(),
  profilePicture: z.string().url("Must be a valid URL").optional().nullable(),
});

// ─── Project ─────────────────────────────────────────────────────────────────

const stageEnum = z.enum([
  "IDEA",
  "PLANNING",
  "IN_DEVELOPMENT",
  "BETA",
  "LAUNCHED",
]);

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Name too short").max(100),
  description: z
    .string()
    .trim()
    .min(10, "Description too short")
    .max(2000),
  techStack: z
    .array(z.string().trim().min(1).max(50))
    .min(1, "Add at least one technology")
    .max(20),
  stage: stageEnum,
  lookingFor: z
    .array(z.string().trim().min(1).max(50))
    .min(1, "Add at least one role")
    .max(10),
});

export const updateProjectSchema = createProjectSchema.partial();

// ─── Task ─────────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  assigneeId: z.string().cuid("Invalid user ID").optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

// ─── Join Request ─────────────────────────────────────────────────────────────

export const joinRequestStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
