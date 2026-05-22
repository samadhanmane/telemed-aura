import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { SpecialtyId } from "../../constants/specialties.js";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface IAppointment extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  specialty: SpecialtyId;
  date: string;
  time: string;
  status: AppointmentStatus;
  fee: number;
  mode: "video";
  roomId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    specialty: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    fee: { type: Number, required: true },
    mode: { type: String, default: "video" },
    roomId: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

appointmentSchema.index({ doctorId: 1, date: 1, time: 1 }, { unique: true });
appointmentSchema.index({ patientId: 1, date: -1 });

export const Appointment: Model<IAppointment> =
  mongoose.models.Appointment ??
  mongoose.model<IAppointment>("Appointment", appointmentSchema);
