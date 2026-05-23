import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IEmrSnapshot extends Document {
  patientId: Types.ObjectId;
  generatedBy: "system" | "patient" | "doctor";
  generatedByUserId?: Types.ObjectId;
  label: string;
  snapshot: Record<string, unknown>;
  createdAt: Date;
}

const emrSnapshotSchema = new Schema<IEmrSnapshot>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    generatedBy: { type: String, enum: ["system", "patient", "doctor"], required: true },
    generatedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    label: { type: String, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

emrSnapshotSchema.index({ patientId: 1, createdAt: -1 });

export const EmrSnapshot: Model<IEmrSnapshot> =
  mongoose.models.EmrSnapshot ??
  mongoose.model<IEmrSnapshot>("EmrSnapshot", emrSnapshotSchema);
