import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as reviewsService from "./reviews.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";

export const submitReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appointmentId, rating, comment } = req.body;
  const review = await reviewsService.submitConsultationReview(req.user!.userId, {
    appointmentId: String(appointmentId),
    rating: Number(rating),
    comment,
  });
  return sendSuccess(res, "Thank you for your feedback", { review }, 201);
});

export const listMyReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reviews = await reviewsService.listMyReviews(req.user!.userId);
  return sendSuccess(res, "Reviews loaded", { reviews });
});

export const getAppointmentReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await reviewsService.getReviewForAppointment(
    req.user!.userId,
    String(req.params.appointmentId),
  );
  return sendSuccess(res, "Review loaded", { review });
});
