import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IConsultationRecord extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId: Types.ObjectId;
  doctorName: string;
  specialization: string;
  conclusion: string;
  clinicalRemarks: string;
  vitals?: {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    sugarLevel?: number;
    oxygenLevel?: number;
  };
  prescriptionIds: Types.ObjectId[];
  consultDate: string;
  consultTime: string;
  completedAt: Date;
  createdAt: Date;
}

const consultationRecordSchema = new Schema<IConsultationRecord>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
    doctorName: { type: String, required: true },
    specialization: { type: String, required: true },
    conclusion: { type: String, default: "" },
    clinicalRemarks: { type: String, default: "" },
    vitals: {
      bloodPressureSystolic: Number,
      bloodPressureDiastolic: Number,
      sugarLevel: Number,
      oxygenLevel: Number,
    },
    prescriptionIds: [{ type: Schema.Types.ObjectId, ref: "Prescription" }],
    consultDate: { type: String, required: true },
    consultTime: { type: String, required: true },
    completedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

consultationRecordSchema.index({ patientId: 1, completedAt: -1 });
consultationRecordSchema.index({ doctorId: 1, patientId: 1 });
consultationRecordSchema.index({ appointmentId: 1 }, { unique: true });

export const ConsultationRecord: Model<IConsultationRecord> =
  mongoose.models.ConsultationRecord ??
  mongoose.model<IConsultationRecord>("ConsultationRecord", consultationRecordSchema);
