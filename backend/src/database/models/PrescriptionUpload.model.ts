import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { IMedicine } from "./Prescription.model.js";

export interface IPrescriptionUpload extends Document {
  patientId: Types.ObjectId;
  originalName: string;
  mimeType: string;
  fileUrl: string;
  cloudinaryPublicId: string;
  ocrText: string;
  ocrConfidence: number;
  medicines: IMedicine[];
  scanSummary?: Record<string, unknown>;
  pageCount?: number;
  extractionMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, default: "" },
    frequency: { type: String, default: "" },
    duration: { type: String, default: "" },
  },
  { _id: false },
);

const prescriptionUploadSchema = new Schema<IPrescriptionUpload>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    ocrText: { type: String, default: "" },
    ocrConfidence: { type: Number, default: 0 },
    medicines: { type: [medicineSchema], default: [] },
    scanSummary: { type: Schema.Types.Mixed },
    pageCount: { type: Number },
    extractionMethod: { type: String },
  },
  { timestamps: true },
);

prescriptionUploadSchema.index({ patientId: 1, createdAt: -1 });

export const PrescriptionUpload: Model<IPrescriptionUpload> =
  mongoose.models.PrescriptionUpload ??
  mongoose.model<IPrescriptionUpload>("PrescriptionUpload", prescriptionUploadSchema);
