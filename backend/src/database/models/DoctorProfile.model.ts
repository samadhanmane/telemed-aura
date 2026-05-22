import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { SpecialtyId } from "../../constants/specialties.js";

export interface IDoctorProfile extends Document {
  userId: Types.ObjectId;
  specialty: SpecialtyId;
  licenseNumber: string;
  experienceYears: number;
  consultationFee: number;
  bio?: string;
  rating: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorProfileSchema = new Schema<IDoctorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialty: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    experienceYears: { type: Number, required: true, min: 0 },
    consultationFee: { type: Number, required: true, min: 0 },
    bio: { type: String },
    rating: { type: Number, default: 4.8 },
    verified: { type: Boolean, default: true },
  },
  { timestamps: true },
);

doctorProfileSchema.index({ specialty: 1 });

export const DoctorProfile: Model<IDoctorProfile> =
  mongoose.models.DoctorProfile ??
  mongoose.model<IDoctorProfile>("DoctorProfile", doctorProfileSchema);
