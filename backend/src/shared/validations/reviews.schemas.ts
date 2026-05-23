import { z } from "zod";
import { objectIdSchema } from "./common.js";

export const submitReviewSchema = z.object({
  appointmentId: objectIdSchema,
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().optional(),
});
