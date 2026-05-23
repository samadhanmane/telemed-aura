import {
  Appointment,
  User,
  DoctorProfile,
  Notification,
  CriticalCareAlert,
  SymptomScan,
} from "../../database/models/index.js";
import { getSpecialtyLabel } from "../../constants/specialties.js";
import { getTodayDateString, slotToLocalDate } from "../../shared/appointment-slots.js";
import {
  assertSlotAvailable,
  getAvailableSlots,
  getNextFreeSlot,
} from "../doctors/doctors.service.js";
import { formatAppointment } from "../appointments/appointments.service.js";
import {
  getPatientSeveritySnapshot,
  type PatientSeveritySnapshot,
  type SeverityLevel,
} from "./patient-severity.service.js";

const ALERT_TTL_HOURS = 48;
const CONFLICT_WINDOW_MINUTES = 30;

export function isCriticalSeverity(severity: PatientSeveritySnapshot): boolean {
  return (
    severity.emergency ||
    severity.severity === "Critical" ||
    severity.severity === "High" ||
    severity.riskScore >= 65
  );
}

function alertExpiry(): Date {
  const d = new Date();
  d.setHours(d.getHours() + ALERT_TTL_HOURS);
  return d;
}

/** Open or refresh platform-wide critical alert when patient becomes severe. */
export async function upsertOpenCriticalAlert(
  patientId: string,
  data: {
    source: "symptom_scan" | "report" | "system";
    sourceId?: string;
    severity: string;
    riskScore: number;
    emergency: boolean;
  },
) {
  const existingClaimed = await CriticalCareAlert.findOne({
    patientId,
    status: "claimed",
    expiresAt: { $gt: new Date() },
  });
  if (existingClaimed) return existingClaimed;

  const open = await CriticalCareAlert.findOneAndUpdate(
    { patientId, status: { $in: ["open", "dismissed"] } },
    {
      $set: {
        source: data.source,
        sourceId: data.sourceId,
        severity: data.severity,
        riskScore: data.riskScore,
        emergency: data.emergency,
        status: "open",
        expiresAt: alertExpiry(),
        patientDismissedNotification: false,
      },
    },
    { upsert: true, new: true },
  );
  return open;
}

export async function getActiveAlertForPatient(patientId: string) {
  const alert = await CriticalCareAlert.findOne({
    patientId,
    status: { $in: ["open", "claimed"] },
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  if (!alert) return null;

  let claimedByDoctorName: string | undefined;
  if (alert.claimedByDoctorId) {
    const doc = await User.findById(alert.claimedByDoctorId);
    claimedByDoctorName = doc?.name;
  }

  let appointment: ReturnType<typeof formatAppointment> | null = null;
  if (alert.appointmentId) {
    const a = await Appointment.findById(alert.appointmentId);
    if (a) {
      const patient = await User.findById(a.patientId);
      const doctor = await User.findById(a.doctorId);
      const profile = doctor ? await DoctorProfile.findOne({ userId: doctor._id }) : null;
      if (patient && doctor) appointment = formatAppointment(a, patient, doctor, profile);
    }
  }

  return {
    id: alert._id.toString(),
    status: alert.status,
    severity: alert.severity,
    riskScore: alert.riskScore,
    emergency: alert.emergency,
    patientDismissedNotification: alert.patientDismissedNotification,
    claimedByDoctorId: alert.claimedByDoctorId?.toString(),
    claimedByDoctorName,
    appointment,
    canPatientBook: alert.status === "open",
    expiresAt: alert.expiresAt,
  };
}

export async function dismissCriticalNotification(patientId: string) {
  await CriticalCareAlert.updateMany(
    { patientId, status: { $in: ["open", "dismissed"] }, expiresAt: { $gt: new Date() } },
    { $set: { patientDismissedNotification: true } },
  );
  return { ok: true };
}

function minutesBetweenSlots(
  dateA: string,
  timeA: string,
  dateB: string,
  timeB: string,
): number {
  const a = slotToLocalDate(dateA, timeA).getTime();
  const b = slotToLocalDate(dateB, timeB).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 9999;
  return Math.abs(a - b) / 60_000;
}

export async function findDoctorConflictsWithin30Min(
  doctorId: string,
  criticalDate: string,
  criticalTime: string,
  excludeAppointmentId?: string,
) {
  const upcoming = await Appointment.find({
    doctorId,
    status: { $in: ["pending", "confirmed", "in_progress"] },
  }).lean();

  return upcoming
    .filter((a) => a._id.toString() !== excludeAppointmentId)
    .filter(
      (a) =>
        minutesBetweenSlots(criticalDate, criticalTime, a.date, a.time) <=
        CONFLICT_WINDOW_MINUTES,
    )
    .map((a) => ({
      id: a._id.toString(),
      patientId: a.patientId.toString(),
      date: a.date,
      time: a.time,
      status: a.status,
    }));
}

async function claimAlertForDoctor(patientId: string, doctorId: string) {
  const claimed = await CriticalCareAlert.findOneAndUpdate(
    {
      patientId,
      status: "open",
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        status: "claimed",
        claimedByDoctorId: doctorId,
        claimedAt: new Date(),
      },
    },
    { new: true },
  );

  if (claimed) return { alert: claimed, alreadyMine: false };

  const mine = await CriticalCareAlert.findOne({
    patientId,
    status: "claimed",
    claimedByDoctorId: doctorId,
    expiresAt: { $gt: new Date() },
  });
  if (mine) return { alert: mine, alreadyMine: true };

  const other = await CriticalCareAlert.findOne({
    patientId,
    status: "claimed",
    expiresAt: { $gt: new Date() },
  }).populate("claimedByDoctorId");
  if (other) {
    const doc = await User.findById(other.claimedByDoctorId);
    throw new Error(
      `This critical patient is already accepted by Dr. ${doc?.name ?? "another doctor"}. Only that doctor can consult them now.`,
    );
  }

  const booked = await Appointment.findOne({
    patientId,
    status: { $in: ["pending", "confirmed", "in_progress"] },
    priority: "urgent",
    date: { $gte: getTodayDateString() },
  });
  if (booked) {
    const doc = await User.findById(booked.doctorId);
    throw new Error(
      `Patient already has an urgent visit with Dr. ${doc?.name ?? "a doctor"} on ${booked.date} at ${booked.time}.`,
    );
  }

  throw new Error("Critical case is no longer available — it may have expired or been accepted.");
}

/** Doctor accepts critical patient — exclusive lock + urgent appointment. */
export async function acceptCriticalImmediate(
  doctorId: string,
  data: {
    patientId: string;
    date: string;
    time: string;
    specialty?: string;
  },
) {
  await assertSlotAvailable(doctorId, data.date, data.time);

  const { alert, alreadyMine } = await claimAlertForDoctor(data.patientId, doctorId);

  const doctor = await User.findById(doctorId);
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  const patient = await User.findById(data.patientId);
  if (!doctor || !profile || !patient) throw new Error("Doctor or patient not found");

  let appointment;
  if (alreadyMine && alert.appointmentId) {
    const existing = await Appointment.findById(alert.appointmentId);
    if (existing) {
      appointment = formatAppointment(existing, patient, doctor, profile);
    }
  }

  if (!appointment) {
    const specialty =
      (data.specialty ?? profile.specialty) as import("../../constants/specialties.js").SpecialtyId;
    const doc = await Appointment.create({
      patientId: data.patientId,
      doctorId,
      specialty,
      date: data.date,
      time: data.time,
      fee: 0,
      status: "confirmed",
      mode: "video",
      roomId: `critical-${Date.now()}`,
      notes: `Critical care — ${alert.severity} (${alert.riskScore}% risk). Exclusive acceptance.`,
      priority: "urgent",
    });
    alert.appointmentId = doc._id;
    await alert.save();
    appointment = formatAppointment(doc, patient, doctor, profile);

    await Notification.insertMany([
      {
        userId: data.patientId,
        type: "emergency",
        title: "Urgent doctor assigned",
        message: `Dr. ${doctor.name} accepted your critical case for ${data.date} at ${data.time}. Join the video call at that time.`,
        meta: { appointmentId: doc._id.toString(), critical: true },
      },
      {
        userId: doctorId,
        type: "appointment",
        title: "Critical patient assigned to you",
        message: `${patient.name} — urgent consult ${data.date} ${data.time}. Reschedule any visit within 30 minutes if needed.`,
        meta: { appointmentId: doc._id.toString(), critical: true },
      },
    ]);
  }

  const conflicts = await findDoctorConflictsWithin30Min(
    doctorId,
    data.date,
    data.time,
    appointment.id,
  );

  return {
    appointment,
    alertId: alert._id.toString(),
    alreadyAccepted: alreadyMine,
    conflictsWithin30Min: conflicts,
    mustRescheduleFirst: conflicts.length > 0,
  };
}

/** Patient books critical call — locks to chosen doctor. */
export async function patientBookCritical(
  patientId: string,
  data: { doctorId: string; date: string; time: string },
) {
  return acceptCriticalImmediate(data.doctorId, {
    patientId,
    date: data.date,
    time: data.time,
  });
}

/** Critical board for all doctors — only open + mine; never other doctor's claimed patients. */
export async function listCriticalBoardForDoctor(doctorId: string) {
  const alerts = await CriticalCareAlert.find({
    expiresAt: { $gt: new Date() },
    $or: [
      { status: "open" },
      { status: "claimed", claimedByDoctorId: doctorId },
    ],
  })
    .sort({ riskScore: -1, emergency: -1, createdAt: -1 })
    .limit(40)
    .lean();

  const today = getTodayDateString();
  const myTodayCritical = await Appointment.findOne({
    doctorId,
    patientId: { $exists: true },
    priority: "urgent",
    date: today,
    status: { $in: ["pending", "confirmed", "in_progress"] },
  }).sort({ time: 1 });

  let assignedToday: {
    appointment: ReturnType<typeof formatAppointment>;
    severity: PatientSeveritySnapshot;
  } | null = null;

  if (myTodayCritical) {
    const severity = await getPatientSeveritySnapshot(myTodayCritical.patientId.toString());
    const patient = await User.findById(myTodayCritical.patientId);
    const doctor = await User.findById(myTodayCritical.doctorId);
    const profile = doctor ? await DoctorProfile.findOne({ userId: doctor._id }) : null;
    if (patient && doctor) {
      assignedToday = {
        appointment: formatAppointment(myTodayCritical, patient, doctor, profile),
        severity,
      };
    }
  }

  const patients: {
    alertId: string;
    severity: PatientSeveritySnapshot;
    claimStatus: "open" | "claimed" | "dismissed";
    canAccept: boolean;
    isAssignedToMe: boolean;
    claimedByDoctorName?: string;
    appointmentId?: string;
    upcomingWithMe: { id: string; date: string; time: string } | null;
  }[] = [];

  for (const alert of alerts) {
    const pid = alert.patientId.toString();
    let severity: PatientSeveritySnapshot;
    try {
      severity = await getPatientSeveritySnapshot(pid);
    } catch {
      continue;
    }
    if (!isCriticalSeverity(severity)) continue;

    const isMine =
      alert.status === "claimed" && alert.claimedByDoctorId?.toString() === doctorId;
    const claimedByOther =
      alert.status === "claimed" && alert.claimedByDoctorId?.toString() !== doctorId;

    if (claimedByOther) continue;

    let claimedByDoctorName: string | undefined;
    if (alert.claimedByDoctorId) {
      const d = await User.findById(alert.claimedByDoctorId);
      claimedByDoctorName = d?.name;
    }

    const upcoming = await Appointment.findOne({
      doctorId,
      patientId: pid,
      status: { $in: ["pending", "confirmed", "in_progress"] },
    });

    patients.push({
      alertId: alert._id.toString(),
      severity,
      claimStatus: alert.status as "open" | "claimed" | "dismissed",
      canAccept: alert.status === "open",
      isAssignedToMe: isMine,
      claimedByDoctorName,
      appointmentId: alert.appointmentId?.toString(),
      upcomingWithMe: upcoming
        ? { id: upcoming._id.toString(), date: upcoming.date, time: upcoming.time }
        : null,
    });
  }

  patients.sort((a, b) => b.severity.priorityScore - a.severity.priorityScore);

  return {
    patients,
    assignedToday,
    suggestedSlot: await getNextFreeSlot(doctorId, today),
  };
}

/** Non-critical patients only for doctors who have consulted them — used by triage queue only. */
export async function listMyPatientsNonCriticalQueue(doctorId: string) {
  const { getDoctorTriageQueue } = await import("./triage.service.js");
  const queue = await getDoctorTriageQueue(doctorId);
  const filtered = [];
  for (const item of queue.queue) {
    if (!isCriticalSeverity(item.severity)) {
      filtered.push(item);
    }
  }
  return { ...queue, queue: filtered };
}

export async function onSymptomScanCritical(
  patientId: string,
  scanId: string,
  analysis: {
    severity: string;
    risk: number;
    emergency: boolean;
    recommendation: string;
  },
) {
  const sev = severityFromLabel(analysis.severity);
  const snap: PatientSeveritySnapshot = {
    patientId,
    patientName: "",
    riskScore: analysis.risk,
    severity: sev,
    emergency: analysis.emergency,
    reasons: [analysis.recommendation],
    healthScore: 82,
    priorityScore: analysis.risk,
  };
  if (!isCriticalSeverity(snap)) return null;

  const user = await User.findById(patientId);
  if (user) snap.patientName = user.name;

  const alert = await upsertOpenCriticalAlert(patientId, {
    source: "symptom_scan",
    sourceId: scanId,
    severity: analysis.severity,
    riskScore: analysis.risk,
    emergency: analysis.emergency,
  });

  await Notification.create({
    userId: patientId,
    type: "emergency",
    title: "Critical — book urgent video call",
    message: `${analysis.recommendation} Tap to book an immediate consultation or dismiss to read your full report.`,
    meta: { scanId, criticalAlertId: alert._id.toString(), canDismiss: true },
  });

  return alert;
}

function severityFromLabel(s: string): SeverityLevel {
  if (s === "Critical" || s === "High" || s === "Moderate" || s === "Low") return s;
  return "High";
}
