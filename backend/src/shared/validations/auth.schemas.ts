import { z } from "zod";
import { SPECIALTIES } from "../../constants/specialties.js";
import { emailSchema, nameSchema, passwordSchema, phoneSchema } from "./common.js";

const specialtyIds = SPECIALTIES.map((s) => s.id) as [string, ...string[]];

export const registerPatientSchema = z.object({
  role: z.literal("patient").optional(),
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  location: z.string().trim().optional(),
});

export const registerDoctorSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  specialty: z.enum(specialtyIds, { message: "Please select a valid specialty" }),
  licenseNumber: z
    .string({ required_error: "Medical license number is required" })
    .trim()
    .min(3, "Medical license number is required"),
  experienceYears: z.coerce
    .number({ invalid_type_error: "Experience must be a valid number" })
    .min(0, "Experience must be a valid number")
    .max(60, "Experience must be a valid number"),
  bio: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
});

export const forgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordResetSchema = z.object({
  email: emailSchema,
  otp: z.string().min(6, "Enter the 6-digit code from your email"),
  newPassword: passwordSchema,
});

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema,
  })
  .refine((d) => d.name !== undefined || d.phone !== undefined, {
    message: "No profile fields to update",
  });
