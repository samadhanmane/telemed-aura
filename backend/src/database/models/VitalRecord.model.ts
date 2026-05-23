import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IVitalRecord extends Document {
  patientId: Types.ObjectId;
  source: "ai_scan" | "manual" | "consultation" | "emr_update";
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  sugarLevel?: number;
  oxygenLevel?: number;
  appointmentId?: Types.ObjectId;
  note?: string;
  recordedAt: Date;
  createdAt: Date;
}

const vitalRecordSchema = new Schema<IVitalRecord>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    source: {
      type: String,
      enum: ["ai_scan", "manual", "consultation", "emr_update"],
      required: true,
    },
    bloodPressureSystolic: { type: Number },
    bloodPressureDiastolic: { type: Number },
    sugarLevel: { type: Number },
    oxygenLevel: { type: Number },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    note: { type: String },
    recordedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

vitalRecordSchema.index({ patientId: 1, recordedAt: -1 });

export const VitalRecord: Model<IVitalRecord> =
  mongoose.models.VitalRecord ??
  mongoose.model<IVitalRecord>("VitalRecord", vitalRecordSchema);
