import { z } from "zod";
import { SPECIALTIES } from "../../constants/specialties.js";
import { objectIdSchema } from "./common.js";
import {
  normalizeSlotTimeForStorage,
  parseTimeToMinutes,
  slotToLocalDateFromTime,
} from "../appointment-slots.js";

const specialtyIds = SPECIALTIES.map((s) => s.id) as [string, ...string[]];

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please select appointment date");

/** Accepts booking UI labels (9:00 AM) or HH:mm; stores HH:mm. */
const timeSchema = z
  .string({ required_error: "Please select a time slot" })
  .min(1, "Please select a time slot")
  .refine((t) => parseTimeToMinutes(t) >= 0, "Please select a valid time slot")
  .transform((t) => normalizeSlotTimeForStorage(t));

export const createAppointmentSchema = z.object({
  doctorId: objectIdSchema,
  date: dateSchema,
  time: timeSchema,
  specialty: z.enum(specialtyIds, { message: "Please select a valid specialty" }),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled"], {
    message: "Invalid appointment status",
  }),
  conclusion: z.string().trim().optional(),
  vitals: z
    .object({
      bloodPressureSystolic: z.number().optional(),
      bloodPressureDiastolic: z.number().optional(),
      sugarLevel: z.number().optional(),
      oxygenLevel: z.number().optional(),
    })
    .optional(),
});

export function assertFutureAppointmentDate(date: string, time: string) {
  const slotStart = slotToLocalDateFromTime(date, time);
  if (Number.isNaN(slotStart.getTime())) {
    throw new Error("Please select appointment date");
  }
  if (slotStart.getTime() < Date.now() - 60_000) {
    throw new Error("Appointments cannot be booked in the past");
  }
}
