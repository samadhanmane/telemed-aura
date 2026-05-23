import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface IPrescription extends Document {
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  doctorName: string;
  specialization: string;
  medicines: IMedicine[];
  instructions: string;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
  },
  { _id: false },
);

const prescriptionSchema = new Schema<IPrescription>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    doctorName: { type: String, required: true },
    specialization: { type: String, required: true },
    medicines: { type: [medicineSchema], default: [] },
    instructions: { type: String, default: "" },
  },
  { timestamps: true },
);

prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, patientId: 1, createdAt: -1 });

export const Prescription: Model<IPrescription> =
  mongoose.models.Prescription ??
  mongoose.model<IPrescription>("Prescription", prescriptionSchema);
