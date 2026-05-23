import { z } from "zod";
import { objectIdSchema } from "./common.js";
import { createAppointmentSchema } from "./appointment.schemas.js";
import {
  normalizeSlotTimeForStorage,
  parseTimeToMinutes,
} from "../appointment-slots.js";

const bookableTimeSchema = z
  .string()
  .min(1, "Please select a time slot")
  .refine((t) => parseTimeToMinutes(t) >= 0, "Please select a valid time slot")
  .transform((t) => normalizeSlotTimeForStorage(t));

export const clinicalNoteSchema = z.object({
  content: z.string().min(1, "content required"),
  appointmentId: z.string().optional(),
});

export const prescriptionCreateSchema = z.object({
  medicines: z
    .array(
      z.object({
        name: z.string().min(1),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        duration: z.string().optional(),
      }),
    )
    .min(1, "At least one medicine required"),
  instructions: z.string().optional(),
  appointmentId: z.string().optional(),
});

export const followUpSchema = z.object({
  patientId: objectIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: bookableTimeSchema,
  specialty: z.string().optional(),
  sourceAppointmentId: z.string().optional(),
});

export const reportReviewSchema = z.object({
  remarks: z.string().trim().min(1, "remarks required"),
  severityOverride: z.enum(["Low", "Moderate", "High", "Critical"]).optional(),
  confirmedFlags: z.array(z.string()).optional(),
});

export const bookingSlotSchema = createAppointmentSchema.pick({
  date: true,
  time: true,
});

export const urgentBookSchema = z.object({
  patientId: objectIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: bookableTimeSchema,
  specialty: z.string().optional(),
  rescheduleOtherAppointmentId: z.string().optional(),
});

export const criticalBookSchema = z.object({
  doctorId: objectIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: bookableTimeSchema,
});

export const rescheduleSchema = z.object({
  appointmentId: z.string().min(1, "appointmentId required"),
  date: z.string().optional(),
  time: z
    .string()
    .optional()
    .transform((t) => (t ? normalizeSlotTimeForStorage(t) : undefined)),
  autoNextSlot: z.boolean().optional(),
  reason: z.string().optional(),
});

export const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date query required (YYYY-MM-DD)"),
});
