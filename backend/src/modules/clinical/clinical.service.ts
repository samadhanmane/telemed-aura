import {
  Appointment,
  User,
  DoctorProfile,
  ClinicalNote,
  Prescription,
  MedicalReport,
  Notification,
  type IMedicine,
  type IAiAnalysis,
} from "../../database/models/index.js";
import { getSpecialtyLabel } from "../../constants/specialties.js";
import type { SpecialtyId } from "../../constants/specialties.js";
import {
  severityFromRemarks,
  severityToRiskScore,
} from "../../../services/ai/rules/remark-severity.rules.js";

export async function assertDoctorPatientAccess(doctorId: string, patientId: string) {
  const link = await Appointment.findOne({
    doctorId,
    patientId,
    status: { $nin: ["cancelled"] },
  });
  if (!link) throw new Error("You have no consultation history with this patient");
  return link;
}

export async function getPatientContext(doctorId: string, patientId: string) {
  await assertDoctorPatientAccess(doctorId, patientId);

  const patient = await User.findById(patientId);
  if (!patient || patient.role !== "patient") throw new Error("Patient not found");

  const note = await ClinicalNote.findOne({ doctorId, patientId });
  const appointments = await Appointment.find({ doctorId, patientId })
    .sort({ date: -1, time: -1 })
    .lean();
  const prescriptions = await Prescription.find({ doctorId, patientId })
    .sort({ createdAt: -1 })
    .lean();
  const allPrescriptions = await Prescription.find({ patientId }).sort({ createdAt: -1 }).lean();
  const reports = await MedicalReport.find({ patientId }).sort({ createdAt: -1 }).lean();

  return {
    patient: {
      id: patient._id.toString(),
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      location: patient.location,
      healthScore: patient.healthScore ?? 82,
    },
    clinicalNote: note
      ? {
          content: note.content,
          updatedAt: note.updatedAt,
          lastAppointmentId: note.lastAppointmentId?.toString(),
        }
      : { content: "", updatedAt: null, lastAppointmentId: null },
    appointments: appointments.map((a) => ({
      id: a._id.toString(),
      date: a.date,
      time: a.time,
      status: a.status,
      specialization: getSpecialtyLabel(a.specialty),
    })),
    prescriptions: prescriptions.map(formatPrescription),
    allPrescriptions: allPrescriptions.map(formatPrescription),
    reports: reports.map(formatReport),
  };
}

export async function upsertClinicalNote(
  doctorId: string,
  patientId: string,
  content: string,
  appointmentId?: string,
) {
  await assertDoctorPatientAccess(doctorId, patientId);
  const note = await ClinicalNote.findOneAndUpdate(
    { doctorId, patientId },
    {
      content,
      lastAppointmentId: appointmentId,
    },
    { upsert: true, new: true },
  );
  return {
    content: note.content,
    updatedAt: note.updatedAt,
    lastAppointmentId: note.lastAppointmentId?.toString(),
  };
}

export async function createPrescription(
  doctorId: string,
  data: {
    patientId: string;
    appointmentId?: string;
    medicines: IMedicine[];
    instructions: string;
  },
) {
  await assertDoctorPatientAccess(doctorId, data.patientId);
  const doctor = await User.findById(doctorId);
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  if (!doctor || !profile) throw new Error("Doctor profile not found");

  const rx = await Prescription.create({
    doctorId,
    patientId: data.patientId,
    appointmentId: data.appointmentId,
    doctorName: doctor.name,
    specialization: getSpecialtyLabel(profile.specialty),
    medicines: data.medicines,
    instructions: data.instructions,
  });

  await Notification.create({
    userId: data.patientId,
    type: "prescription",
    title: "New prescription",
    message: `Dr. ${doctor.name} issued a prescription with ${data.medicines.length} medicine(s).`,
    meta: { prescriptionId: rx._id.toString() },
  });

  return formatPrescription(rx.toObject());
}

export async function listPatientReportsForDoctor(doctorId: string, patientId: string) {
  await assertDoctorPatientAccess(doctorId, patientId);
  const reports = await MedicalReport.find({ patientId }).sort({ createdAt: -1 });
  return reports.map(formatReport);
}

export async function reviewMedicalReport(
  doctorId: string,
  reportId: string,
  data: {
    remarks: string;
    severityOverride?: IAiAnalysis["severity"];
    confirmedFlags?: string[];
  },
) {
  const report = await MedicalReport.findById(reportId);
  if (!report) throw new Error("Report not found");
  await assertDoctorPatientAccess(doctorId, report.patientId.toString());
  if (!report.aiAnalysis) throw new Error("Report has no AI analysis yet");

  const ai = report.aiAnalysis;
  let severity = ai.severity;
  let riskScore = ai.riskScore;
  const abnormalities = [...(ai.abnormalities ?? [])];

  if (data.remarks.trim()) {
    const bump = severityFromRemarks([data.remarks], { severity, riskScore });
    severity = bump.severity;
    riskScore = Math.min(98, riskScore + bump.riskBump);
    abnormalities.push(...bump.flags);
  }

  if (data.severityOverride) {
    severity = data.severityOverride;
    riskScore = severityToRiskScore(severity);
  }

  ai.severity = severity;
  ai.riskScore = riskScore;
  ai.abnormalities = [...new Set(abnormalities)].slice(0, 20);
  if (data.confirmedFlags?.length) {
    ai.insights = [
      ...new Set([...ai.insights, ...data.confirmedFlags.map((f) => `Doctor confirmed: ${f}`)]),
    ].slice(0, 8);
  }
  ai.doctorReview = {
    doctorId,
    remarks: data.remarks.trim(),
    severityOverride: data.severityOverride,
    confirmedFlags: data.confirmedFlags,
    reviewedAt: new Date().toISOString(),
  };

  report.aiAnalysis = ai;
  report.markModified("aiAnalysis");
  await report.save();

  await Notification.create({
    userId: report.patientId,
    type: "report",
    title: "Doctor reviewed your report",
    message: `Your doctor added clinical remarks on ${report.name}.`,
    meta: { reportId: report._id.toString() },
  });

  return formatReport(report.toObject());
}

export async function listDoctorPrescriptions(doctorId: string) {
  const list = await Prescription.find({ doctorId }).sort({ createdAt: -1 }).lean();
  const results = [];
  for (const rx of list) {
    const patient = await User.findById(rx.patientId);
    results.push({
      ...formatPrescription(rx),
      patientName: patient?.name ?? "Patient",
    });
  }
  return results;
}

export async function listPatientReports(patientId: string) {
  const reports = await MedicalReport.find({ patientId }).sort({ createdAt: -1 });
  return reports.map(formatReport);
}

export async function listPrescriptionsForPatient(patientId: string) {
  const list = await Prescription.find({ patientId }).sort({ createdAt: -1 });
  return list.map(formatPrescription);
}

export async function listDoctorPatientReports(doctorId: string) {
  const appointments = await Appointment.find({ doctorId }).distinct("patientId");
  const reports = await MedicalReport.find({ patientId: { $in: appointments } })
    .sort({ createdAt: -1 })
    .lean();

  const results = [];
  for (const r of reports) {
    const patient = await User.findById(r.patientId);
    results.push({
      ...formatReport(r),
      patientName: patient?.name ?? "Patient",
    });
  }
  return results;
}

function formatPrescription(rx: {
  _id: { toString(): string };
  doctorId: { toString(): string };
  patientId: { toString(): string };
  appointmentId?: { toString(): string };
  doctorName: string;
  specialization: string;
  medicines: IMedicine[];
  instructions: string;
  createdAt: Date;
}) {
  return {
    id: rx._id.toString(),
    doctorId: rx.doctorId.toString(),
    patientId: rx.patientId.toString(),
    appointmentId: rx.appointmentId?.toString(),
    doctorName: rx.doctorName,
    specialization: rx.specialization,
    medicines: rx.medicines,
    instructions: rx.instructions,
    date: rx.createdAt.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function formatReport(r: {
  _id: { toString(): string };
  patientId: { toString(): string };
  name: string;
  type: string;
  category: string;
  uploadDate: string;
  fileUrl?: string;
  aiAnalysis?: IAiAnalysis;
}) {
  return {
    id: r._id.toString(),
    patientId: r.patientId.toString(),
    name: r.name,
    type: r.type,
    uploadDate: r.uploadDate,
    category: r.category,
    fileUrl: r.fileUrl,
    aiAnalysis: r.aiAnalysis,
  };
}

