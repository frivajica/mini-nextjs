import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});

export const settingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
