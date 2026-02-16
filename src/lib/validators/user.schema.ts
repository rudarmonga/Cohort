import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email().optional(),
  userName: z.string().min(4, "UserName must be at least 4 characters").optional(),
  age: z.number().min(0).optional(),
});