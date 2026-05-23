import { Router } from "express";
import * as reviewsController from "./reviews.controller.js";
import { requireAuth, requireRole } from "../../shared/middleware/auth.middleware.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { submitReviewSchema } from "../../shared/validations/reviews.schemas.js";

export const reviewsRoutes = Router();

reviewsRoutes.use(requireAuth, requireRole("patient"));

reviewsRoutes.post("/", validate(submitReviewSchema), reviewsController.submitReview);
reviewsRoutes.get("/", reviewsController.listMyReviews);
reviewsRoutes.get("/appointment/:appointmentId", reviewsController.getAppointmentReview);
