import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character").regex(/\d/, "Password must contain at least one number"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  userName: z.string().min(4, "UserName must be at least 4 characters"),
  email: z.string().email(),
  password: z.string().min(6).regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character").regex(/\d/, "Password must contain at least one number"),
  age: z.number().min(0).optional(),
});