import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type CriticalAlertStatus = "open" | "claimed" | "dismissed" | "expired";

export interface ICriticalCareAlert extends Document {
  patientId: Types.ObjectId;
  source: "symptom_scan" | "report" | "system";
  sourceId?: Types.ObjectId;
  severity: string;
  riskScore: number;
  emergency: boolean;
  status: CriticalAlertStatus;
  claimedByDoctorId?: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  patientDismissedNotification: boolean;
  expiresAt: Date;
  claimedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const criticalCareAlertSchema = new Schema<ICriticalCareAlert>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    source: { type: String, enum: ["symptom_scan", "report", "system"], default: "symptom_scan" },
    sourceId: { type: Schema.Types.ObjectId },
    severity: { type: String, required: true },
    riskScore: { type: Number, required: true },
    emergency: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["open", "claimed", "dismissed", "expired"],
      default: "open",
      index: true,
    },
    claimedByDoctorId: { type: Schema.Types.ObjectId, ref: "User" },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    patientDismissedNotification: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    claimedAt: { type: Date },
  },
  { timestamps: true },
);

criticalCareAlertSchema.index({ patientId: 1, status: 1 });
criticalCareAlertSchema.index({ status: 1, expiresAt: 1 });

export const CriticalCareAlert: Model<ICriticalCareAlert> =
  mongoose.models.CriticalCareAlert ??
  mongoose.model<ICriticalCareAlert>("CriticalCareAlert", criticalCareAlertSchema);
