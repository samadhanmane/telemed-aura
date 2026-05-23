import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { SpecialtyId } from "../../constants/specialties.js";
import type { DoctorAvailability } from "../../shared/appointment-slots.js";

export type DoctorVerificationStatus = "pending" | "approved" | "rejected";

export interface IDoctorProfile extends Document {
  userId: Types.ObjectId;
  specialty: SpecialtyId;
  licenseNumber: string;
  experienceYears: number;
  consultationFee: number;
  bio?: string;
  rating: number;
  reviewCount: number;
  /** Live on patient-facing doctor list when true (set with approval). */
  verified: boolean;
  verificationStatus: DoctorVerificationStatus;
  certificateUrl?: string;
  certificatePublicId?: string;
  rejectionReason?: string;
  reviewedAt?: Date;
  hospital?: string;
  languages: string[];
  qualifications: string[];
  /** Weekly hours, blocked dates, accepting toggle — drives free slot list. */
  availability?: DoctorAvailability;
  createdAt: Date;
  updatedAt: Date;
}

const doctorProfileSchema = new Schema<IDoctorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialty: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    experienceYears: { type: Number, required: true, min: 0 },
    consultationFee: { type: Number, default: 0, min: 0 },
    bio: { type: String },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    certificateUrl: { type: String },
    certificatePublicId: { type: String },
    rejectionReason: { type: String },
    reviewedAt: { type: Date },
    hospital: { type: String },
    languages: { type: [String], default: ["English", "Hindi"] },
    qualifications: { type: [String], default: [] },
    availability: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

doctorProfileSchema.index({ specialty: 1 });

export const DoctorProfile: Model<IDoctorProfile> =
  mongoose.models.DoctorProfile ??
  mongoose.model<IDoctorProfile>("DoctorProfile", doctorProfileSchema);
