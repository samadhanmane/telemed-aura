import {
  Appointment,
  User,
  DoctorProfile,
  Notification,
  SymptomScan,
  MedicalReport,
} from "../../database/models/index.js";
import { getSpecialtyLabel } from "../../constants/specialties.js";
import {
  assertSlotAvailable,
  getNextFreeSlot,
} from "../doctors/doctors.service.js";
import {
  formatAppointment,
  rescheduleAppointment as rescheduleApptCore,
} from "../appointments/appointments.service.js";
import {
  getPatientSeveritySnapshot,
  compareSeveritySnapshots,
  type PatientSeveritySnapshot,
} from "./patient-severity.service.js";

const QUEUE_OVERLOAD_THRESHOLD = 10;
const CRITICAL_LOOKBACK_DAYS = 14;

export async function getDoctorTriageQueue(doctorId: string) {
  const raw = await Appointment.find({
    doctorId,
    status: { $in: ["pending", "confirmed", "in_progress"] },
  })
    .sort({ date: 1, time: 1 })
    .lean();

  const items: {
    appointment: ReturnType<typeof formatAppointment>;
    severity: PatientSeveritySnapshot;
    isMyPatient: boolean;
  }[] = [];

  for (const a of raw) {
    const pid = a.patientId.toString();
    let severity: PatientSeveritySnapshot;
    try {
      severity = await getPatientSeveritySnapshot(pid);
    } catch {
      continue;
    }
    const patient = await User.findById(pid);
    const doctor = await User.findById(a.doctorId);
    const profile = doctor ? await DoctorProfile.findOne({ userId: doctor._id }) : null;
    if (!patient || !doctor) continue;

    items.push({
      appointment: formatAppointment(a, patient, doctor, profile),
      severity,
      isMyPatient: true,
    });
  }

  items.sort((x, y) => compareSeveritySnapshots(x.severity, y.severity));

  return {
    totalUpcoming: items.length,
    overloaded: items.length > QUEUE_OVERLOAD_THRESHOLD,
    threshold: QUEUE_OVERLOAD_THRESHOLD,
    queue: items,
  };
}

/** Delegates to exclusive critical-care board (open + assigned-to-me only). */
export async function listPlatformCriticalPatients(doctorId: string) {
  const { listCriticalBoardForDoctor } = await import("./critical-care.service.js");
  const board = await listCriticalBoardForDoctor(doctorId);
  return {
    patients: board.patients.map((p) => ({
      severity: p.severity,
      alertId: p.alertId,
      isMyPatient: p.isAssignedToMe,
      hasUpcomingWithMe: Boolean(p.upcomingWithMe),
      canAccept: p.canAccept,
      isAssignedToMe: p.isAssignedToMe,
      claimedByDoctorName: p.claimedByDoctorName,
      appointmentId: p.appointmentId,
      upcomingWithMe: p.upcomingWithMe
        ? { ...p.upcomingWithMe, status: "confirmed" }
        : null,
    })),
    assignedToday: board.assignedToday,
    suggestedSlot: board.suggestedSlot,
  };
}

export async function rescheduleAppointment(
  doctorId: string,
  appointmentId: string,
  data: {
    date?: string;
    time?: string;
    autoNextSlot?: boolean;
    reason?: string;
  },
) {
  return rescheduleApptCore(appointmentId, doctorId, data);
}

/** Urgent consult — any verified doctor; optional bump of another booking to next free slot. */
export async function createUrgentConsultation(
  doctorId: string,
  data: {
    patientId: string;
    date: string;
    time: string;
    specialty?: string;
    rescheduleOtherAppointmentId?: string;
  },
) {
  await assertSlotAvailable(doctorId, data.date, data.time);

  const doctor = await User.findById(doctorId);
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  const patient = await User.findById(data.patientId);
  if (!doctor || !profile || !patient) throw new Error("Doctor or patient not found");

  const severity = await getPatientSeveritySnapshot(data.patientId);
  const specialty =
    (data.specialty ?? profile.specialty) as import("../../constants/specialties.js").SpecialtyId;

  if (data.rescheduleOtherAppointmentId) {
    await rescheduleAppointment(doctorId, data.rescheduleOtherAppointmentId, {
      autoNextSlot: true,
      reason: `Rescheduled — urgent case for ${patient.name} (${severity.severity})`,
    });
  }

  const appointment = await Appointment.create({
    patientId: data.patientId,
    doctorId,
    specialty,
    date: data.date,
    time: data.time,
    fee: 0,
    status: "confirmed",
    mode: "video",
    roomId: `urgent-${Date.now()}`,
    notes: `Urgent triage — ${severity.severity} (${severity.riskScore}% risk)`,
    priority: "urgent",
  });

  const specialtyLabel = getSpecialtyLabel(specialty);
  await Notification.insertMany([
    {
      userId: data.patientId,
      type: "appointment",
      title: "Urgent consultation scheduled",
      message: `Dr. ${doctor.name} scheduled an urgent video visit on ${data.date} at ${data.time} (${specialtyLabel}).`,
      meta: { appointmentId: appointment._id.toString(), urgent: true },
    },
    {
      userId: doctorId,
      type: "appointment",
      title: "Urgent visit booked",
      message: `${patient.name} — ${data.date} ${data.time} (${severity.severity}).`,
      meta: { appointmentId: appointment._id.toString(), urgent: true },
    },
  ]);

  return formatAppointment(appointment, patient, doctor, profile);
}
