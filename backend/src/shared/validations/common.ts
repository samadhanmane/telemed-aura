import { z } from "zod";

const INDIAN_MOBILE = /^(?:\+91[\-\s]?)?[6-9]\d{9}$/;

export const emailSchema = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain uppercase, lowercase, and number")
  .regex(/[a-z]/, "Password must contain uppercase, lowercase, and number")
  .regex(/[0-9]/, "Password must contain uppercase, lowercase, and number");

export const nameSchema = z
  .string({ required_error: "Name is required" })
  .trim()
  .min(2, "Name must be at least 2 characters")
  .refine((v) => !/^\d+$/.test(v), "Name is required");

export const phoneSchema = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || INDIAN_MOBILE.test(v.replace(/\s/g, "")), {
    message: "Please enter a valid mobile number",
  });

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid identifier");

export function zodFieldErrors(error: z.ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
}
