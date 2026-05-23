import { Appointment, User, DoctorProfile, Notification } from "../../database/models/index.js";
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

  const { assertSlotAvailable } = await import("../doctors/doctors.service.js");
  await assertSlotAvailable(data.doctorId, data.date, data.time);

  const patient = await User.findById(patientId);
  if (!patient) throw new Error("Patient not found");

  const appointment = await Appointment.create({
    patientId,
    doctorId: data.doctorId,
    specialty: data.specialty as import("../../constants/specialties.js").SpecialtyId,
    date: data.date,
    time: data.time,
    fee: 0,
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

  const specialtyLabel = getSpecialtyLabel(data.specialty);
  await Notification.insertMany([
    {
      userId: patientId,
      type: "appointment",
      title: "Appointment requested",
      message: `Your ${specialtyLabel} visit with Dr. ${doctor.name} on ${data.date} at ${data.time} is pending confirmation.`,
      meta: { appointmentId: appointment._id.toString() },
    },
    {
      userId: data.doctorId,
      type: "appointment",
      title: "New appointment",
      message: `${patient.name} booked ${specialtyLabel} on ${data.date} at ${data.time}.`,
      meta: { appointmentId: appointment._id.toString() },
    },
  ]);

  return formatAppointment(appointment, patient, doctor, profile);
}

export async function getAppointmentById(appointmentId: string, userId: string, role: string) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error("Appointment not found");

  const isPatient = appointment.patientId.toString() === userId;
  const isDoctor = appointment.doctorId.toString() === userId;
  if (role === "patient" && !isPatient) throw new Error("Forbidden");
  if (role === "doctor" && !isDoctor) throw new Error("Forbidden");
  if (role !== "admin" && !isPatient && !isDoctor) throw new Error("Forbidden");

  const patient = await User.findById(appointment.patientId);
  const doctor = await User.findById(appointment.doctorId);
  const profile = doctor ? await DoctorProfile.findOne({ userId: doctor._id }) : null;
  if (!patient || !doctor) throw new Error("Appointment data incomplete");
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
  emrPayload?: {
    conclusion?: string;
    vitals?: {
      bloodPressureSystolic?: number;
      bloodPressureDiastolic?: number;
      sugarLevel?: number;
      oxygenLevel?: number;
    };
  },
) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error("Appointment not found");

  if (role === "doctor" && appointment.doctorId.toString() !== userId) {
    throw new Error("Forbidden");
  }

  if (status === "completed") {
    if (role !== "doctor") {
      throw new Error("Only the doctor can mark a consultation as completed");
    }
    if (appointment.status !== "in_progress" && appointment.status !== "confirmed") {
      throw new Error("Only an active consultation can be marked completed");
    }
    appointment.status = "completed";
    await appointment.save();
    const { finalizeConsultationEmr } = await import("../emr/emr.service.js");
    await finalizeConsultationEmr(appointmentId, userId, emrPayload).catch((err) =>
      console.error("[emr] consultation finalize:", err),
    );
  } else {
    appointment.status = status;
    await appointment.save();
  }

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

    await Notification.create({
      userId: appointment.patientId,
      type: "appointment",
      title: `Appointment ${status}`,
      message: `Your visit with ${doctor?.name ?? "doctor"} on ${appointment.date} at ${appointment.time} is now ${status}.`,
      meta: { appointmentId: appointment._id.toString() },
    });
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

  if (appointment.status === "completed") {
    throw new Error(
      "This consultation is completed. The doctor must start a new appointment to video consult again.",
    );
  }
  if (appointment.status === "cancelled") {
    throw new Error("This appointment was cancelled.");
  }
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

/** Disconnect from video only — appointment stays in_progress until doctor marks completed. */
export async function leaveVideoSession(
  appointmentId: string,
  userId: string,
  role: string,
  draft?: {
    conclusion?: string;
    vitals?: {
      bloodPressureSystolic?: number;
      bloodPressureDiastolic?: number;
      sugarLevel?: number;
      oxygenLevel?: number;
    };
  },
) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error("Appointment not found");

  const isPatient = appointment.patientId.toString() === userId;
  const isDoctor = appointment.doctorId.toString() === userId;
  if (role === "patient" && !isPatient) throw new Error("Forbidden");
  if (role === "doctor" && !isDoctor) throw new Error("Forbidden");

  if (role === "doctor" && draft && (draft.conclusion?.trim() || draft.vitals)) {
    const { ClinicalNote } = await import("../../database/models/index.js");
    const patientId = appointment.patientId;
    const content = draft.conclusion?.trim();
    if (content) {
      await ClinicalNote.findOneAndUpdate(
        { doctorId: userId, patientId },
        { doctorId: userId, patientId, content, updatedAt: new Date() },
        { upsert: true, new: true },
      );
    }
    if (draft.vitals) {
      const { recordVitals } = await import("../emr/emr.service.js");
      await recordVitals(patientId.toString(), {
        source: "manual",
        ...draft.vitals,
      }).catch(() => undefined);
    }
  }

  const patient = await User.findById(appointment.patientId);
  const doctor = await User.findById(appointment.doctorId);
  const profile = doctor ? await DoctorProfile.findOne({ userId: doctor._id }) : null;
  return formatAppointment(appointment, patient!, doctor!, profile);
}

/** @deprecated Use leaveVideoSession — kept as alias for older clients. */
export async function endVideoSession(
  appointmentId: string,
  userId: string,
  role: string,
  emrPayload?: Parameters<typeof leaveVideoSession>[3],
) {
  return leaveVideoSession(appointmentId, userId, role, emrPayload);
}

/** Doctor schedules a follow-up with a patient they have consulted before. */
export async function createFollowUpAppointment(
  doctorId: string,
  data: {
    patientId: string;
    date: string;
    time: string;
    specialty?: string;
    sourceAppointmentId?: string;
  },
) {
  const prior = await Appointment.findOne({
    doctorId,
    patientId: data.patientId,
    status: { $in: ["completed", "confirmed", "in_progress", "pending"] },
  });
  if (!prior) throw new Error("No prior consultation with this patient");

  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== "doctor") throw new Error("Doctor not found");

  const profile = await DoctorProfile.findOne({ userId: doctor._id });
  if (!profile) throw new Error("Doctor profile not found");

  const patient = await User.findById(data.patientId);
  if (!patient) throw new Error("Patient not found");

  const { assertSlotAvailable } = await import("../doctors/doctors.service.js");
  await assertSlotAvailable(doctorId, data.date, data.time);

  const specialty = (data.specialty ?? prior.specialty) as import("../../constants/specialties.js").SpecialtyId;

  const appointment = await Appointment.create({
    patientId: data.patientId,
    doctorId,
    specialty,
    date: data.date,
    time: data.time,
    fee: 0,
    status: "confirmed",
    roomId: `appt-${Date.now()}`,
    notes: data.sourceAppointmentId
      ? `Follow-up from consultation ${data.sourceAppointmentId}`
      : "Follow-up visit",
  });

  const specialtyLabel = getSpecialtyLabel(specialty);
  await Notification.insertMany([
    {
      userId: data.patientId,
      type: "appointment",
      title: "Follow-up scheduled",
      message: `Dr. ${doctor.name} booked your follow-up on ${data.date} at ${data.time} (${specialtyLabel}).`,
      meta: { appointmentId: appointment._id.toString(), followUp: true },
    },
    {
      userId: doctorId,
      type: "appointment",
      title: "Follow-up booked",
      message: `Follow-up with ${patient.name} on ${data.date} at ${data.time}.`,
      meta: { appointmentId: appointment._id.toString(), followUp: true },
    },
  ]);

  try {
    await sendAppointmentBookedEmails({
      patientEmail: patient.email,
      patientName: patient.name,
      doctorEmail: doctor.email,
      doctorName: doctor.name,
      specialty: getSpecialtyLabel(specialty),
      date: data.date,
      time: data.time,
    });
  } catch (err) {
    console.error("[mail] follow-up notification failed:", err);
  }

  return formatAppointment(appointment, patient, doctor, profile);
}

export function formatAppointment(
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
    notes?: string;
    priority?: string;
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
    mode: a.mode,
    roomId: a.roomId,
    notes: a.notes,
    priority: a.priority ?? "normal",
  };
}

export async function rescheduleAppointment(
  appointmentId: string,
  doctorId: string,
  data: {
    date?: string;
    time?: string;
    autoNextSlot?: boolean;
    reason?: string;
  },
) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error("Appointment not found");
  if (appointment.doctorId.toString() !== doctorId) throw new Error("Forbidden");

  let date = data.date;
  let time = data.time;

  const { getNextFreeSlot, assertSlotAvailable } = await import("../doctors/doctors.service.js");

  if (data.autoNextSlot || !date || !time) {
    const next = await getNextFreeSlot(doctorId, appointment.date);
    if (!next) throw new Error("No free slots available to reschedule");
    date = next.date;
    time = next.time;
  }

  await assertSlotAvailable(doctorId, date!, time!);

  const oldWhen = `${appointment.date} ${appointment.time}`;
  appointment.date = date!;
  appointment.time = time!;
  const noteLine = data.reason ?? `Rescheduled from ${oldWhen}`;
  appointment.notes = appointment.notes ? `${appointment.notes}\n${noteLine}` : noteLine;
  await appointment.save();

  const patient = await User.findById(appointment.patientId);
  const doctor = await User.findById(appointment.doctorId);
  if (patient) {
    await Notification.create({
      userId: appointment.patientId,
      type: "appointment",
      title: "Appointment rescheduled",
      message: `Your visit moved to ${date} at ${time}. ${noteLine}`,
      meta: { appointmentId: appointment._id.toString() },
    });
  }

  const profile = doctor ? await DoctorProfile.findOne({ userId: doctor._id }) : null;
  return formatAppointment(appointment, patient!, doctor!, profile);
}
