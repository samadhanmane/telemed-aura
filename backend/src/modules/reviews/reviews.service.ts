import mongoose from "mongoose";
import {
  Appointment,
  ConsultationReview,
  DoctorProfile,
  User,
} from "../../database/models/index.js";
import { getSpecialtyLabel } from "../../constants/specialties.js";

async function refreshDoctorRating(doctorId: string) {
  const stats = await ConsultationReview.aggregate([
    { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const avg = stats[0]?.avg ?? 4.8;
  const count = stats[0]?.count ?? 0;
  await DoctorProfile.findOneAndUpdate(
    { userId: doctorId },
    { rating: Math.round(avg * 10) / 10, reviewCount: count },
  );
}

export async function submitConsultationReview(
  patientId: string,
  input: { appointmentId: string; rating: number; comment?: string },
) {
  const appointment = await Appointment.findById(input.appointmentId);
  if (!appointment) throw new Error("Appointment not found");
  if (appointment.patientId.toString() !== patientId) {
    throw new Error("Not your appointment");
  }
  if (appointment.status !== "completed") {
    throw new Error("You can rate only after the consultation is completed");
  }
  if (input.rating < 1 || input.rating > 5) throw new Error("Rating must be 1–5");

  const existing = await ConsultationReview.findOne({ appointmentId: appointment._id });
  if (existing) throw new Error("You already reviewed this consultation");

  const review = await ConsultationReview.create({
    patientId,
    doctorId: appointment.doctorId,
    appointmentId: appointment._id,
    rating: input.rating,
    comment: input.comment?.trim(),
  });

  await refreshDoctorRating(appointment.doctorId.toString());

  const doctor = await User.findById(appointment.doctorId);
  const profile = await DoctorProfile.findOne({ userId: appointment.doctorId });

  return {
    id: review._id.toString(),
    rating: review.rating,
    comment: review.comment,
    doctorName: doctor?.name ?? "Doctor",
    specialty: profile ? getSpecialtyLabel(profile.specialty) : "",
    createdAt: review.createdAt,
  };
}

export async function listMyReviews(patientId: string) {
  const list = await ConsultationReview.find({ patientId }).sort({ createdAt: -1 }).lean();
  const out = [];
  for (const r of list) {
    const doctor = await User.findById(r.doctorId);
    out.push({
      id: r._id.toString(),
      appointmentId: r.appointmentId.toString(),
      rating: r.rating,
      comment: r.comment,
      doctorName: doctor?.name ?? "Doctor",
      createdAt: r.createdAt,
    });
  }
  return out;
}

export async function getReviewForAppointment(patientId: string, appointmentId: string) {
  const review = await ConsultationReview.findOne({ appointmentId, patientId }).lean();
  if (!review) return null;
  return {
    id: review._id.toString(),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}
