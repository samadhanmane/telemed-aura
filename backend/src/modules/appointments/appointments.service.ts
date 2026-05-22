import { Appointment, User, DoctorProfile } from "../../database/models/index.js";
import { getSpecialtyLabel } from "../../constants/specialties.js";
import {
  sendAppointmentBookedEmails,
  sendAppointmentStatusEmail,
} from "../../services/mail.service.js";
import type { AppointmentStatus } from "../../database/models/Appointment.model.js";
import { signVideoSessionToken } from "../../shared/utils/video-session.js";

export async function createAppointment(
  patientId: string,
  data: { doctorId: string; date: string; time: string; specialty: string },
) {
  const doctor = await User.findById(data.doctorId);
  if (!doctor || doctor.role !== "doctor") throw new Error("Doctor not found");

  const profile = await DoctorProfile.findOne({ userId: doctor._id });
  if (!profile) throw new Error("Doctor profile not found");

  const existing = await Appointment.findOne({
    doctorId: data.doctorId,
    date: data.date,
    time: data.time,
    status: { $nin: ["cancelled"] },
  });
  if (existing) throw new Error("This slot is already booked");

  const patient = await User.findById(patientId);
  if (!patient) throw new Error("Patient not found");

  const appointment = await Appointment.create({
    patientId,
    doctorId: data.doctorId,
    specialty: data.specialty as import("../../constants/specialties.js").SpecialtyId,
    date: data.date,
    time: data.time,
    fee: profile.consultationFee,
    status: "pending",
    roomId: `appt-${Date.now()}`,
  });

  try {
    await sendAppointmentBookedEmails({
      patientEmail: patient.email,
      patientName: patient.name,
      doctorEmail: doctor.email,
      doctorName: doctor.name,
      specialty: getSpecialtyLabel(data.specialty),
      date: data.date,
      time: data.time,
    });
  } catch (err) {
    console.error("[mail] booking notification failed:", err);
  }

  return formatAppointment(appointment, patient, doctor, profile);
}

export async function listAppointments(userId: string, role: string) {
  const filter =
    role === "doctor"
      ? { doctorId: userId }
      : role === "patient"
        ? { patientId: userId }
        : {};

  const list = await Appointment.find(filter).sort({ date: -1, time: 1 }).lean();
  const results = [];

  for (const a of list) {
    const patient = await User.findById(a.patientId);
    const doctor = await User.findById(a.doctorId);
    const profile = doctor ? await DoctorProfile.findOne({ userId: doctor._id }) : null;
    if (patient && doctor) {
      results.push(formatAppointment(a, patient, doctor, profile));
    }
  }
  return results;
}

export async function updateStatus(
  appointmentId: string,
  userId: string,
  role: string,
  status: AppointmentStatus,
) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error("Appointment not found");

  if (role === "doctor" && appointment.doctorId.toString() !== userId) {
    throw new Error("Forbidden");
  }

  appointment.status = status;
  await appointment.save();

  const patient = await User.findById(appointment.patientId);
  const doctor = await User.findById(appointment.doctorId);
  if (patient) {
    try {
      await sendAppointmentStatusEmail({
        to: patient.email,
        name: patient.name,
        status,
        doctorName: doctor?.name ?? "Doctor",
        date: appointment.date,
        time: appointment.time,
      });
    } catch (err) {
      console.error("[mail] status notification failed:", err);
    }
  }

  const profile = doctor ? await DoctorProfile.findOne({ userId: doctor._id }) : null;
  return formatAppointment(appointment, patient!, doctor!, profile);
}

const JOINABLE_STATUSES = ["confirmed", "in_progress"] as const;

export async function createVideoSession(
  appointmentId: string,
  userId: string,
  role: string,
) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error("Appointment not found");

  const isPatient = appointment.patientId.toString() === userId;
  const isDoctor = appointment.doctorId.toString() === userId;

  if (role === "patient" && !isPatient) throw new Error("Not authorized for this consultation");
  if (role === "doctor" && !isDoctor) throw new Error("Not authorized for this consultation");
  if (!isPatient && !isDoctor) throw new Error("Forbidden");

  if (!JOINABLE_STATUSES.includes(appointment.status as (typeof JOINABLE_STATUSES)[number])) {
    throw new Error("Consultation is not available. Appointment must be confirmed.");
  }

  if (appointment.status === "confirmed") {
    appointment.status = "in_progress";
    await appointment.save();
  }

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const patient = await User.findById(appointment.patientId);
  const doctor = await User.findById(appointment.doctorId);
  const profile = doctor ? await DoctorProfile.findOne({ userId: doctor._id }) : null;

  const sessionToken = signVideoSessionToken({
    userId,
    role: role as "patient" | "doctor",
    appointmentId: appointment._id.toString(),
    name: user.name,
  });

  return {
    sessionToken,
    appointment: formatAppointment(appointment, patient!, doctor!, profile),
    role,
    expiresIn: "2h",
  };
}

export async function endVideoSession(
  appointmentId: string,
  userId: string,
  role: string,
) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error("Appointment not found");

  const isPatient = appointment.patientId.toString() === userId;
  const isDoctor = appointment.doctorId.toString() === userId;
  if (role === "patient" && !isPatient) throw new Error("Forbidden");
  if (role === "doctor" && !isDoctor) throw new Error("Forbidden");

  if (appointment.status === "in_progress") {
    appointment.status = "completed";
    await appointment.save();
  }

  const patient = await User.findById(appointment.patientId);
  const doctor = await User.findById(appointment.doctorId);
  const profile = doctor ? await DoctorProfile.findOne({ userId: doctor._id }) : null;
  return formatAppointment(appointment, patient!, doctor!, profile);
}

function formatAppointment(
  a: {
    _id: { toString(): string };
    patientId: { toString(): string };
    doctorId: { toString(): string };
    specialty: string;
    date: string;
    time: string;
    status: string;
    fee: number;
    mode: string;
    roomId?: string;
  },
  patient: { name: string; email: string },
  doctor: { name: string; email: string },
  profile: { specialty: string; consultationFee: number } | null,
) {
  return {
    id: a._id.toString(),
    patientId: a.patientId.toString(),
    patientName: patient.name,
    doctorId: a.doctorId.toString(),
    doctorName: doctor.name,
    specialization: getSpecialtyLabel(a.specialty),
    specialty: a.specialty,
    date: a.date,
    time: a.time,
    status: a.status,
    fee: `₹${a.fee}`,
    feeAmount: a.fee,
    mode: a.mode,
    roomId: a.roomId,
  };
}
