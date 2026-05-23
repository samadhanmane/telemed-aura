import { z } from "zod";

const INDIAN_MOBILE = /^(?:\+91[\-\s]?)?[6-9]\d{9}$/;

export const emailField = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const passwordField = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain uppercase, lowercase, and number")
  .regex(/[a-z]/, "Password must contain uppercase, lowercase, and number")
  .regex(/[0-9]/, "Password must contain uppercase, lowercase, and number");

export const loginPasswordField = z.string().min(1, "Password is required");

export const nameField = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .refine((v) => !/^\d+$/.test(v.trim()), "Name is required");

export const phoneField = z
  .string()
  .optional()
  .refine((v) => !v?.trim() || INDIAN_MOBILE.test(v.replace(/\s/g, "")), {
    message: "Please enter a valid mobile number",
  });

export const patientRegisterSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  phone: phoneField,
  location: z.string().optional(),
});

export const doctorRegisterSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  phone: phoneField,
  specialty: z.string().min(1, "Please select a valid specialty"),
  licenseNumber: z.string().min(1, "Medical license number is required"),
  experienceYears: z.coerce.number().min(0, "Experience must be a valid number"),
  bio: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailField,
  password: loginPasswordField,
});
