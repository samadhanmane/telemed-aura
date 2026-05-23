import { z } from "zod";
import { SPECIALTIES } from "../../constants/specialties.js";
import { objectIdSchema } from "./common.js";

const specialtyIds = SPECIALTIES.map((s) => s.id) as [string, ...string[]];

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please select appointment date");

const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Please select a time slot");

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
  const slot = new Date(`${date}T${time}:00`);
  if (Number.isNaN(slot.getTime())) {
    throw new Error("Please select appointment date");
  }
  if (slot.getTime() < Date.now() - 60_000) {
    throw new Error("Appointments cannot be booked in the past");
  }
}
