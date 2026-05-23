import {
  User,
  Appointment,
  Prescription,
  MedicalReport,
  SymptomScan,
  ClinicalNote,
  VitalRecord,
  ConsultationRecord,
  EmrSnapshot,
  Notification,
  PrescriptionUpload,
} from "../../database/models/index.js";
import { getSpecialtyLabel } from "../../constants/specialties.js";
import { assertDoctorPatientAccess } from "../clinical/clinical.service.js";

const SNAPSHOT_INTERVAL_MS = 24 * 60 * 60 * 1000;

export async function assertDoctorCanViewEmr(doctorId: string, patientId: string) {
  try {
    return await assertDoctorPatientAccess(doctorId, patientId);
  } catch {
    const { getPatientSeveritySnapshot } = await import("../clinical/patient-severity.service.js");
    const severity = await getPatientSeveritySnapshot(patientId);
    if (
      severity.emergency ||
      severity.severity === "Critical" ||
      severity.severity === "High" ||
      severity.riskScore >= 65
    ) {
      return;
    }
    throw new Error("You have no consultation history with this patient");
  }
}

export async function recordVitals(
  patientId: string,
  data: {
    source: "ai_scan" | "manual" | "consultation" | "emr_update";
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    sugarLevel?: number;
    oxygenLevel?: number;
    appointmentId?: string;
    note?: string;
  },
) {
  const hasValue =
    data.bloodPressureSystolic != null ||
    data.bloodPressureDiastolic != null ||
    data.sugarLevel != null ||
    data.oxygenLevel != null;
  if (!hasValue) return null;

  return VitalRecord.create({
    patientId,
    source: data.source,
    bloodPressureSystolic: data.bloodPressureSystolic,
    bloodPressureDiastolic: data.bloodPressureDiastolic,
    sugarLevel: data.sugarLevel,
    oxygenLevel: data.oxygenLevel,
    appointmentId: data.appointmentId,
    note: data.note,
    recordedAt: new Date(),
  });
}

export async function updatePatientHealthProfile(
  patientId: string,
  data: {
    name?: string;
    age?: number;
    gender?: string;
    allergies?: string[];
    chronicDiseases?: string[];
    phone?: string;
    location?: string;
  },
) {
  const user = await User.findByIdAndUpdate(
    patientId,
    {
      ...(data.name != null ? { name: data.name.trim() } : {}),
      ...(data.age != null ? { age: data.age } : {}),
      ...(data.gender != null ? { gender: data.gender } : {}),
      ...(data.allergies != null ? { allergies: data.allergies } : {}),
      ...(data.chronicDiseases != null ? { chronicDiseases: data.chronicDiseases } : {}),
      ...(data.phone != null ? { phone: data.phone } : {}),
      ...(data.location != null ? { location: data.location } : {}),
    },
    { new: true },
  );
  if (!user) throw new Error("Patient not found");
  return formatPatientProfile(user);
}

export async function finalizeConsultationEmr(
  appointmentId: string,
  doctorId: string,
  data?: {
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
  if (appointment.doctorId.toString() !== doctorId) throw new Error("Forbidden");

  const patientId = appointment.patientId.toString();
  const doctor = await User.findById(doctorId);
  const note = await ClinicalNote.findOne({ doctorId, patientId });
  const conclusion =
    data?.conclusion?.trim() ||
    note?.content?.trim() ||
    `Video consultation completed on ${appointment.date} at ${appointment.time}.`;

  const existing = await ConsultationRecord.findOne({ appointmentId });
  if (existing) return existing;

  const rxForAppt = await Prescription.find({
    patientId,
    appointmentId,
  }).select("_id");

  const record = await ConsultationRecord.create({
    patientId,
    doctorId,
    appointmentId,
    doctorName: doctor?.name ?? "Doctor",
    specialization: getSpecialtyLabel(appointment.specialty),
    conclusion,
    clinicalRemarks: note?.content ?? "",
    vitals: data?.vitals,
    prescriptionIds: rxForAppt.map((r) => r._id),
    consultDate: appointment.date,
    consultTime: appointment.time,
    completedAt: new Date(),
  });

  if (data?.vitals) {
    await recordVitals(patientId, {
      source: "consultation",
      ...data.vitals,
      appointmentId: appointmentId,
      note: "Recorded at consultation",
    });
  }

  await Notification.create({
    userId: patientId,
    type: "system",
    title: "Consultation added to your health record",
    message: `Your visit with ${doctor?.name ?? "doctor"} on ${appointment.date} was saved to your EMR.`,
    meta: { appointmentId, consultationRecordId: record._id.toString() },
  });

  await generateEmrSnapshot(patientId, "system", undefined, "After consultation");
  return record;
}

export async function generateEmrSnapshot(
  patientId: string,
  generatedBy: "system" | "patient" | "doctor",
  generatedByUserId?: string,
  label = "Health record snapshot",
) {
  const emr = await buildPatientEmrData(patientId);
  const snap = await EmrSnapshot.create({
    patientId,
    generatedBy,
    generatedByUserId,
    label,
    snapshot: emr,
  });
  return {
    id: snap._id.toString(),
    label: snap.label,
    generatedBy: snap.generatedBy,
    createdAt: snap.createdAt,
    snapshot: snap.snapshot,
  };
}

export async function ensureAutoSnapshot24h(patientId: string) {
  const latest = await EmrSnapshot.findOne({ patientId }).sort({ createdAt: -1 });
  if (!latest || Date.now() - latest.createdAt.getTime() >= SNAPSHOT_INTERVAL_MS) {
    return generateEmrSnapshot(patientId, "system", undefined, "24-hour health record update");
  }
  return null;
}

async function buildPatientEmrData(patientId: string) {
  const patient = await User.findById(patientId);
  if (!patient || patient.role !== "patient") throw new Error("Patient not found");

  const [
    consultations,
    prescriptions,
    reports,
    scans,
    vitals,
    appointments,
    snapshots,
    rxUploads,
  ] = await Promise.all([
    ConsultationRecord.find({ patientId }).sort({ completedAt: -1 }).lean(),
    Prescription.find({ patientId }).sort({ createdAt: -1 }).lean(),
    MedicalReport.find({ patientId }).sort({ createdAt: -1 }).lean(),
    SymptomScan.find({ patientId }).sort({ createdAt: -1 }).limit(30).lean(),
    VitalRecord.find({ patientId }).sort({ recordedAt: -1 }).limit(50).lean(),
    Appointment.find({ patientId }).sort({ createdAt: -1 }).lean(),
    EmrSnapshot.find({ patientId }).sort({ createdAt: -1 }).limit(10).lean(),
    PrescriptionUpload.find({ patientId }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const latestVitals = vitals[0];
  const upcoming = appointments.filter((a) =>
    ["pending", "confirmed", "in_progress"].includes(a.status),
  );

  const timeline: {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    at: string;
    meta?: Record<string, unknown>;
  }[] = [];

  for (const c of consultations) {
    timeline.push({
      id: c._id.toString(),
      type: "consultation",
      title: `Consultation — ${c.doctorName}`,
      subtitle: c.conclusion.slice(0, 120) || c.specialization,
      at: c.completedAt.toISOString(),
      meta: { appointmentId: c.appointmentId.toString(), vitals: c.vitals },
    });
  }
  for (const rx of prescriptions) {
    timeline.push({
      id: rx._id.toString(),
      type: "prescription",
      title: `Prescription — ${rx.doctorName}`,
      subtitle: rx.medicines.map((m) => m.name).join(", "),
      at: rx.createdAt.toISOString(),
      meta: { medicines: rx.medicines, instructions: rx.instructions },
    });
  }
  for (const r of reports) {
    timeline.push({
      id: r._id.toString(),
      type: "report",
      title: r.name,
      subtitle: `${r.category} · ${r.type}${r.aiAnalysis ? ` · ${r.aiAnalysis.severity} risk` : ""}`,
      at: (r.createdAt ?? new Date()).toISOString(),
      meta: { fileUrl: r.fileUrl, aiAnalysis: r.aiAnalysis },
    });
  }
  for (const s of scans) {
    timeline.push({
      id: s._id.toString(),
      type: "ai_scan",
      title: "AI symptom scan",
      subtitle: `${s.severity} · ${s.symptoms?.join(", ") ?? ""}`,
      at: s.createdAt.toISOString(),
      meta: { risk: s.risk, emergency: s.emergency },
    });
  }
  for (const v of vitals) {
    timeline.push({
      id: v._id.toString(),
      type: "vitals",
      title: "Vitals recorded",
      subtitle: formatVitalsLine(v),
      at: v.recordedAt.toISOString(),
      meta: { source: v.source },
    });
  }

  for (const u of rxUploads) {
    timeline.push({
      id: u._id.toString(),
      type: "prescription_upload",
      title: `Uploaded Rx — ${u.originalName}`,
      subtitle: u.medicines?.map((m) => m.name).join(", ") ?? "OCR prescription",
      at: u.createdAt.toISOString(),
      meta: { fileUrl: u.fileUrl, medicines: u.medicines },
    });
  }

  timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const healthNarrative = buildHealthNarrative(patient, reports, scans, latestVitals);

  return {
    profile: formatPatientProfile(patient),
    latestVitals: latestVitals
      ? {
          bloodPressureSystolic: latestVitals.bloodPressureSystolic,
          bloodPressureDiastolic: latestVitals.bloodPressureDiastolic,
          sugarLevel: latestVitals.sugarLevel,
          oxygenLevel: latestVitals.oxygenLevel,
          recordedAt: latestVitals.recordedAt,
          source: latestVitals.source,
        }
      : null,
    consultations: consultations.map((c) => ({
      id: c._id.toString(),
      doctorName: c.doctorName,
      specialization: c.specialization,
      date: c.consultDate,
      time: c.consultTime,
      conclusion: c.conclusion,
      clinicalRemarks: c.clinicalRemarks,
      vitals: c.vitals,
      completedAt: c.completedAt,
    })),
    prescriptions: prescriptions.map((rx) => ({
      id: rx._id.toString(),
      doctorName: rx.doctorName,
      specialization: rx.specialization,
      medicines: rx.medicines,
      instructions: rx.instructions,
      date: rx.createdAt,
    })),
    reports: reports.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      type: r.type,
      category: r.category,
      uploadDate: r.uploadDate,
      fileUrl: r.fileUrl,
      aiAnalysis: r.aiAnalysis,
      scanSummary: r.aiAnalysis?.pipeline?.scanSummary,
    })),
    prescriptionUploads: rxUploads.map((u) => ({
      id: u._id.toString(),
      originalName: u.originalName,
      fileUrl: u.fileUrl,
      mimeType: u.mimeType,
      medicines: u.medicines,
      createdAt: u.createdAt,
    })),
    healthNarrative,
    aiScans: scans.map((s) => ({
      id: s._id.toString(),
      symptoms: s.symptoms,
      risk: s.risk,
      severity: s.severity,
      emergency: s.emergency,
      createdAt: s.createdAt,
    })),
    vitalsHistory: vitals.map((v) => ({
      id: v._id.toString(),
      source: v.source,
      bloodPressureSystolic: v.bloodPressureSystolic,
      bloodPressureDiastolic: v.bloodPressureDiastolic,
      sugarLevel: v.sugarLevel,
      oxygenLevel: v.oxygenLevel,
      recordedAt: v.recordedAt,
      note: v.note,
    })),
    upcomingAppointments: upcoming.map((a) => ({
      id: a._id.toString(),
      date: a.date,
      time: a.time,
      status: a.status,
      specialization: getSpecialtyLabel(a.specialty),
    })),
    snapshots: snapshots.map((s) => ({
      id: s._id.toString(),
      label: s.label,
      generatedBy: s.generatedBy,
      createdAt: s.createdAt,
    })),
    timeline,
    generatedAt: new Date().toISOString(),
  };
}

export async function getPatientEmr(patientId: string) {
  await ensureAutoSnapshot24h(patientId);
  const emr = await buildPatientEmrData(patientId);
  const latestSnapshot = await EmrSnapshot.findOne({ patientId }).sort({ createdAt: -1 }).lean();
  return {
    emr,
    latestSnapshot: latestSnapshot
      ? {
          id: latestSnapshot._id.toString(),
          label: latestSnapshot.label,
          generatedBy: latestSnapshot.generatedBy,
          createdAt: latestSnapshot.createdAt,
        }
      : null,
  };
}

export async function getDoctorPatientEmr(doctorId: string, patientId: string) {
  await assertDoctorCanViewEmr(doctorId, patientId);
  const note = await ClinicalNote.findOne({ doctorId, patientId });
  const emrData = await getPatientEmr(patientId);
  return {
    ...emrData,
    doctorClinicalNote: note
      ? { content: note.content, updatedAt: note.updatedAt }
      : { content: "", updatedAt: null },
  };
}

export async function listDoctorPatientsEmr(doctorId: string) {
  const appointments = await Appointment.find({ doctorId }).sort({ createdAt: -1 });
  const seen = new Set<string>();
  const patients = [];

  for (const a of appointments) {
    const pid = a.patientId.toString();
    if (seen.has(pid)) continue;
    seen.add(pid);

    const user = await User.findById(pid);
    if (!user) continue;

    const lastConsult = await ConsultationRecord.findOne({ doctorId, patientId: pid }).sort({
      completedAt: -1,
    });
    const upcoming = await Appointment.findOne({
      doctorId,
      patientId: pid,
      status: { $in: ["pending", "confirmed", "in_progress"] },
    }).sort({ date: 1 });

    const reportCount = await MedicalReport.countDocuments({ patientId: pid });
    const rxCount = await Prescription.countDocuments({ patientId: pid, doctorId });

    let riskLevel = (user.healthScore ?? 82) < 60 ? "high" : (user.healthScore ?? 82) < 75 ? "medium" : "low";
    let severityLabel = "Low";
    let riskScore = 100 - (user.healthScore ?? 82);
    try {
      const { getPatientSeveritySnapshot } = await import("../clinical/patient-severity.service.js");
      const snap = await getPatientSeveritySnapshot(pid);
      severityLabel = snap.severity;
      riskScore = snap.riskScore;
      riskLevel =
        snap.severity === "Critical" || snap.emergency
          ? "high"
          : snap.severity === "High"
            ? "high"
            : snap.severity === "Moderate"
              ? "medium"
              : "low";
    } catch {
      /* keep defaults */
    }

    patients.push({
      id: pid,
      name: user.name,
      phone: user.phone,
      location: user.location,
      healthScore: user.healthScore ?? 82,
      age: user.age,
      gender: user.gender,
      condition: user.chronicDiseases?.[0] ?? "General",
      riskLevel,
      severity: severityLabel,
      riskScore,
      emergency: severityLabel === "Critical",
      lastVisit: lastConsult?.completedAt
        ? lastConsult.completedAt.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : a.date,
      lastConclusion: lastConsult?.conclusion?.slice(0, 100) ?? "",
      upcomingMeeting: upcoming
        ? { date: upcoming.date, time: upcoming.time, status: upcoming.status }
        : null,
      reportCount,
      prescriptionCount: rxCount,
      totalConsultations: await ConsultationRecord.countDocuments({ doctorId, patientId: pid }),
    });
  }

  return patients;
}

function formatPatientProfile(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  phone?: string;
  location?: string;
  age?: number;
  gender?: string;
  allergies?: string[];
  chronicDiseases?: string[];
  healthScore?: number;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    location: user.location,
    age: user.age,
    gender: user.gender,
    allergies: user.allergies ?? [],
    chronicDiseases: user.chronicDiseases ?? [],
    healthScore: user.healthScore ?? 82,
  };
}

function buildHealthNarrative(
  patient: { name: string; chronicDiseases?: string[]; allergies?: string[] },
  reports: { name: string; aiAnalysis?: { severity?: string; patientProblemSummary?: string; summary?: string } }[],
  scans: { severity: string; emergency: boolean }[],
  latestVitals: { bloodPressureSystolic?: number; sugarLevel?: number } | null | undefined,
): string {
  const parts: string[] = [];
  parts.push(`${patient.name}'s consolidated health record.`);
  if (patient.chronicDiseases?.length) {
    parts.push(`Managing: ${patient.chronicDiseases.join(", ")}.`);
  }
  if (patient.allergies?.length) {
    parts.push(`Allergies: ${patient.allergies.join(", ")}.`);
  }
  if (latestVitals) {
    const v: string[] = [];
    if (latestVitals.bloodPressureSystolic != null) {
      v.push(`BP ${latestVitals.bloodPressureSystolic}`);
    }
    if (latestVitals.sugarLevel != null) v.push(`sugar ${latestVitals.sugarLevel} mg/dL`);
    if (v.length) parts.push(`Latest vitals: ${v.join(", ")}.`);
  }
  const latestReport = reports.find((r) => r.aiAnalysis);
  if (latestReport?.aiAnalysis) {
    parts.push(
      `Recent report "${latestReport.name}" (${latestReport.aiAnalysis.severity}): ${
        latestReport.aiAnalysis.patientProblemSummary ??
        latestReport.aiAnalysis.summary?.slice(0, 120) ??
        ""
      }`,
    );
  }
  const urgentScan = scans.find((s) => s.emergency || s.severity === "Critical" || s.severity === "High");
  if (urgentScan) {
    parts.push(`Recent AI symptom scan flagged ${urgentScan.severity} — follow up with clinician.`);
  }
  parts.push(`${reports.length} report(s) on file for doctor review.`);
  return parts.join(" ").slice(0, 600);
}

function formatVitalsLine(v: {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  sugarLevel?: number;
  oxygenLevel?: number;
}) {
  const parts: string[] = [];
  if (v.bloodPressureSystolic != null && v.bloodPressureDiastolic != null) {
    parts.push(`BP ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`);
  }
  if (v.sugarLevel != null) parts.push(`Sugar ${v.sugarLevel} mg/dL`);
  if (v.oxygenLevel != null) parts.push(`SpO₂ ${v.oxygenLevel}%`);
  return parts.join(" · ") || "Vitals updated";
}
