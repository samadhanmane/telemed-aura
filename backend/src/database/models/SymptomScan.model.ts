import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface ISymptomScan extends Document {
  patientId: Types.ObjectId;
  symptoms: string[];
  description?: string;
  bodyArea?: string;
  risk: number;
  severity: string;
  possibleConditions: string[];
  suggestedSpecialist: string;
  emergency: boolean;
  createdAt: Date;
}

const symptomScanSchema = new Schema<ISymptomScan>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    symptoms: [{ type: String }],
    description: { type: String },
    bodyArea: { type: String },
    risk: { type: Number, required: true },
    severity: { type: String, required: true },
    possibleConditions: [{ type: String }],
    suggestedSpecialist: { type: String, required: true },
    emergency: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

symptomScanSchema.index({ patientId: 1, createdAt: -1 });

export const SymptomScan: Model<ISymptomScan> =
  mongoose.models.SymptomScan ??
  mongoose.model<ISymptomScan>("SymptomScan", symptomScanSchema);
