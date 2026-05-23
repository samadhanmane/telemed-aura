import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as reviewsService from "./reviews.service.js";

export async function submitReview(req: AuthRequest, res: Response) {
  try {
    const { appointmentId, rating, comment } = req.body;
    if (!appointmentId || rating == null) {
      return res.status(400).json({ error: "appointmentId and rating required" });
    }
    const review = await reviewsService.submitConsultationReview(req.user!.userId, {
      appointmentId: String(appointmentId),
      rating: Number(rating),
      comment,
    });
    return res.status(201).json({ review });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to submit review";
    return res.status(400).json({ error: msg });
  }
}

export async function listMyReviews(req: AuthRequest, res: Response) {
  const reviews = await reviewsService.listMyReviews(req.user!.userId);
  return res.json({ reviews });
}

export async function getAppointmentReview(req: AuthRequest, res: Response) {
  const review = await reviewsService.getReviewForAppointment(
    req.user!.userId,
    String(req.params.appointmentId),
  );
  return res.json({ review });
}
