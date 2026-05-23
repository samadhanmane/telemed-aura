import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IClinicalNote extends Document {
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  content: string;
  lastAppointmentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clinicalNoteSchema = new Schema<IClinicalNote>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    lastAppointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
  },
  { timestamps: true },
);

clinicalNoteSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

export const ClinicalNote: Model<IClinicalNote> =
  mongoose.models.ClinicalNote ??
  mongoose.model<IClinicalNote>("ClinicalNote", clinicalNoteSchema);
