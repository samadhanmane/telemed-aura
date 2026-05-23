import { Router } from "express";
import * as reviewsController from "./reviews.controller.js";
import { requireAuth, requireRole } from "../../shared/middleware/auth.middleware.js";

export const reviewsRoutes = Router();

reviewsRoutes.use(requireAuth, requireRole("patient"));

reviewsRoutes.post("/", reviewsController.submitReview);
reviewsRoutes.get("/", reviewsController.listMyReviews);
reviewsRoutes.get("/appointment/:appointmentId", reviewsController.getAppointmentReview);
