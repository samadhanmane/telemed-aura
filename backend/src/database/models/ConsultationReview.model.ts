import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IConsultationReview extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const consultationReviewSchema = new Schema<IConsultationReview>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: true },
);

consultationReviewSchema.index({ appointmentId: 1 }, { unique: true });
consultationReviewSchema.index({ doctorId: 1, createdAt: -1 });

export const ConsultationReview: Model<IConsultationReview> =
  mongoose.models.ConsultationReview ??
  mongoose.model<IConsultationReview>("ConsultationReview", consultationReviewSchema);
