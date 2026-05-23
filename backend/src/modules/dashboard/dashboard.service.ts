import {
  User,
  Appointment,
  Prescription,
  MedicalReport,
  SymptomScan,
  Notification,
  DoctorProfile,
  ClinicalNote,
} from "../../database/models/index.js";
import { getSpecialtyLabel } from "../../constants/specialties.js";

export async function getPatientDashboard(patientId: string) {
  const user = await User.findById(patientId);
  const appointments = await Appointment.find({ patientId }).sort({ date: -1, time: -1 });
  const upcoming = appointments.filter((a) => !["completed", "cancelled"].includes(a.status));
  const prescriptions = await Prescription.find({ patientId });
  const activeRx = prescriptions.filter(
    (p) => Date.now() - p.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000,
  );
  const reports = await MedicalReport.find({ patientId });
  const scans = await SymptomScan.find({ patientId }).sort({ createdAt: -1 }).limit(1);
  const lastCompleted = appointments.find((a) => a.status === "completed");
  const unreadAlerts = await Notification.countDocuments({
    userId: patientId,
    read: false,
    type: { $in: ["ai_alert", "emergency", "appointment"] },
  });

  const wellnessScore = user?.healthScore ?? 82;
  const latestScan = scans[0];
  /** Triage urgency 0–100 (higher = seek care sooner). Not the same as wellness score. */
  let screeningRisk = latestScan?.risk ?? Math.max(0, Math.min(100, 100 - wellnessScore));
  const highReports = reports.filter((r) => r.aiAnalysis && r.aiAnalysis.riskScore >= 60);
  if (highReports.length) screeningRisk = Math.min(95, screeningRisk + 6);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  let lastConsult = null;
  if (lastCompleted) {
    const doc = await User.findById(lastCompleted.doctorId);
    lastConsult = {
      doctorName: doc?.name ?? "Doctor",
      date: lastCompleted.date,
      specialization: getSpecialtyLabel(lastCompleted.specialty),
    };
  }

  return {
    greeting,
    userName: user?.name?.split(" ")[0] ?? "there",
    healthScore: wellnessScore,
    healthRisk: screeningRisk,
    screeningRisk,
    healthStatus:
      screeningRisk >= 70
        ? "needs_attention"
        : screeningRisk >= 48
          ? "monitor"
          : "stable",
    stats: {
      upcomingAppointments: upcoming.length,
      activePrescriptions: activeRx.length,
      uploadedReports: reports.length,
      aiAlerts: unreadAlerts,
    },
    upcoming: await formatApptList(upcoming.slice(0, 3)),
    lastConsultation: lastConsult,
    quickTips: [
      "Book a video consult from your village — no travel needed.",
      "Upload lab reports for AI-assisted review before your visit.",
    ],
  };
}

export async function getPatientTimeline(patientId: string) {
  const appointments = await Appointment.find({ patientId }).sort({ createdAt: -1 }).limit(30);
  const prescriptions = await Prescription.find({ patientId }).sort({ createdAt: -1 }).limit(20);
  const reports = await MedicalReport.find({ patientId }).sort({ createdAt: -1 }).limit(20);
  const scans = await SymptomScan.find({ patientId }).sort({ createdAt: -1 }).limit(15);

  const events: {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    date: string;
    meta?: Record<string, unknown>;
  }[] = [];

  for (const a of appointments) {
    const doc = await User.findById(a.doctorId);
    events.push({
      id: a._id.toString(),
      type: "appointment",
      title: `${getSpecialtyLabel(a.specialty)} consultation`,
      subtitle: `${doc?.name ?? "Doctor"} · ${a.status}`,
      date: a.createdAt.toISOString(),
      meta: { status: a.status, date: a.date, time: a.time },
    });
  }
  for (const rx of prescriptions) {
    events.push({
      id: rx._id.toString(),
      type: "prescription",
      title: `Prescription — ${rx.medicines.length} medicine(s)`,
      subtitle: rx.doctorName,
      date: rx.createdAt.toISOString(),
    });
  }
  for (const r of reports) {
    events.push({
      id: r._id.toString(),
      type: "report",
      title: r.name,
      subtitle: r.aiAnalysis ? `AI: ${r.aiAnalysis.severity} risk` : r.category,
      date: r.createdAt.toISOString(),
      meta: { aiAnalysis: r.aiAnalysis },
    });
  }
  for (const s of scans) {
    events.push({
      id: s._id.toString(),
      type: "ai_scan",
      title: "AI symptom scan",
      subtitle: `${s.severity} · ${s.suggestedSpecialist}`,
      date: s.createdAt.toISOString(),
      meta: { emergency: s.emergency, risk: s.risk },
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return events;
}

export async function getPatientAnalytics(patientId: string) {
  const user = await User.findById(patientId);
  const appointments = await Appointment.find({ patientId });
  const scans = await SymptomScan.find({ patientId }).sort({ createdAt: 1 }).limit(12);
  const reports = await MedicalReport.find({ patientId });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const consultFreq = months.map((m, i) => ({
    month: m,
    count: appointments.filter((a) => {
      const d = a.createdAt;
      return d.getMonth() === i && a.status === "completed";
    }).length,
  }));

  const healthScoreTrend = scans.length
    ? scans.map((s, i) => ({
        label: `Scan ${i + 1}`,
        score: Math.max(20, 100 - s.risk),
        date: s.createdAt.toISOString(),
      }))
    : [{ label: "Today", score: user?.healthScore ?? 82, date: new Date().toISOString() }];

  const { VitalRecord } = await import("../../database/models/index.js");
  const vitals = await VitalRecord.find({ patientId })
    .sort({ recordedAt: -1 })
    .limit(24)
    .lean();

  const bpTrend = vitals
    .filter((v) => v.bloodPressureSystolic != null && v.bloodPressureDiastolic != null)
    .slice(0, 12)
    .reverse()
    .map((v, i) => ({
      label: new Date(v.recordedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      systolic: v.bloodPressureSystolic!,
      diastolic: v.bloodPressureDiastolic!,
      date: v.recordedAt.toISOString(),
      source: v.source,
    }));

  if (!bpTrend.length) {
    for (const r of reports) {
      const ev = r.aiAnalysis?.extractedVitals;
      if (ev?.bloodPressureSystolic && ev.bloodPressureDiastolic) {
        bpTrend.push({
          label: r.uploadDate,
          systolic: ev.bloodPressureSystolic,
          diastolic: ev.bloodPressureDiastolic,
          date: r.createdAt.toISOString(),
          source: "emr_update" as const,
        });
      }
    }
  }

  const sugarTrend = vitals
    .filter((v) => v.sugarLevel != null)
    .slice(0, 12)
    .reverse()
    .map((v) => ({
      label: new Date(v.recordedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      fasting: v.sugarLevel!,
      date: v.recordedAt.toISOString(),
      source: v.source,
    }));

  if (!sugarTrend.length) {
    for (const r of reports) {
      const ev = r.aiAnalysis?.extractedVitals;
      const g = ev?.fastingGlucose ?? ev?.randomGlucose;
      if (g != null) {
        sugarTrend.push({
          label: r.uploadDate,
          fasting: g,
          date: r.createdAt.toISOString(),
          source: "emr_update" as const,
        });
      }
    }
  }

  const weightHistory = [
    { label: "Jan", kg: 72 },
    { label: "Feb", kg: 71.5 },
    { label: "Mar", kg: 71 },
    { label: "Apr", kg: 70.8 },
  ];

  const reportMarkers = reports
    .filter((r) => r.aiAnalysis?.chartData?.length)
    .flatMap((r) =>
      r.aiAnalysis!.chartData.map((c) => ({
        report: r.name,
        marker: c.label,
        value: c.value,
      })),
    )
    .slice(0, 8);

  const severityCounts: Record<string, number> = {};
  for (const r of reports) {
    const sev = r.aiAnalysis?.severity;
    if (sev) severityCounts[sev] = (severityCounts[sev] ?? 0) + 1;
  }
  const severityBreakdown = Object.entries(severityCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const scanSeverityCounts: Record<string, number> = {};
  for (const s of scans) {
    scanSeverityCounts[s.severity] = (scanSeverityCounts[s.severity] ?? 0) + 1;
  }
  const symptomSeverityBreakdown = Object.entries(scanSeverityCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const riskTrend = scans.map((s, i) => ({
    label: `Scan ${i + 1}`,
    risk: s.risk,
    severity: s.severity,
    date: s.createdAt.toISOString(),
  }));

  return {
    healthScore: user?.healthScore ?? 82,
    consultationFrequency: consultFreq,
    healthScoreTrend,
    symptomSeverityBreakdown,
    riskTrend,
    bloodPressure: bpTrend,
    bloodSugar: sugarTrend,
    weightHistory,
    reportMarkers,
    severityBreakdown,
  };
}

export async function listDoctorPatients(doctorId: string) {
  const appointments = await Appointment.find({ doctorId }).sort({ updatedAt: -1 });
  const seen = new Set<string>();
  const patients = [];

  for (const a of appointments) {
    const pid = a.patientId.toString();
    if (seen.has(pid)) continue;
    seen.add(pid);
    const user = await User.findById(pid);
    if (!user) continue;
    const last = appointments.find((x) => x.patientId.toString() === pid);
    patients.push({
      id: pid,
      name: user.name,
      phone: user.phone,
      location: user.location,
      healthScore: user.healthScore ?? 82,
      lastVisit: last?.date ?? "—",
      condition: user.chronicDiseases?.[0] ?? "General follow-up",
      riskLevel:
        (user.healthScore ?? 82) < 60 ? "high" : (user.healthScore ?? 82) < 75 ? "medium" : "low",
    });
  }
  return patients;
}

export async function getDoctorDashboard(doctorId: string) {
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  if (!profile || profile.verificationStatus !== "approved") {
    throw new Error("Doctor account is not approved yet");
  }

  const appointments = await Appointment.find({ doctorId });
  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const patientIds = new Set(appointments.map((a) => a.patientId.toString()));
  const todayAppts = appointments.filter(
    (a) => a.date.includes(todayStr.split(",")[1]?.trim() ?? "") || a.status === "in_progress",
  );
  const pending = appointments.filter((a) => a.status === "pending");
  const completed = appointments.filter((a) => a.status === "completed");
  const emergencyScans = await SymptomScan.find({ emergency: true }).limit(5);

  const queue = appointments
    .filter((a) => ["pending", "confirmed", "in_progress"].includes(a.status))
    .slice(0, 8);

  return {
    stats: {
      totalPatients: patientIds.size,
      todayAppointments: todayAppts.length || appointments.filter((a) => a.status !== "cancelled").slice(0, 8).length,
      pendingConsultations: pending.length,
      completedConsultations: completed.length,
      emergencyAlerts: emergencyScans.length,
      rating: profile.rating,
      reviewCount: profile.reviewCount ?? 0,
    },
    profile: {
      specialty: getSpecialtyLabel(profile.specialty),
      verified: profile.verified,
      verificationStatus: profile.verificationStatus,
    },
    queue: await formatApptList(queue),
    emergencyAlerts: emergencyScans.map((s) => ({
      id: s._id.toString(),
      risk: s.risk,
      symptoms: s.symptoms.join(", "),
      createdAt: s.createdAt,
    })),
  };
}

export async function getDoctorPatientDetail(doctorId: string, patientId: string) {
  const patient = await User.findById(patientId);
  if (!patient) throw new Error("Patient not found");

  const link = await Appointment.findOne({ doctorId, patientId });
  if (!link) throw new Error("Not your patient");

  const note = await ClinicalNote.findOne({ doctorId, patientId });
  const appointments = await Appointment.find({ doctorId, patientId }).sort({ date: -1 });
  const prescriptions = await Prescription.find({ patientId }).sort({ createdAt: -1 });
  const reports = await MedicalReport.find({ patientId }).sort({ createdAt: -1 });
  const scans = await SymptomScan.find({ patientId }).sort({ createdAt: -1 }).limit(10);

  return {
    patient: {
      id: patient._id.toString(),
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      location: patient.location,
      age: patient.age,
      gender: patient.gender,
      allergies: patient.allergies ?? [],
      chronicDiseases: patient.chronicDiseases ?? [],
      healthScore: patient.healthScore ?? 82,
    },
    clinicalNote: note?.content ?? "",
    appointments: appointments.map((a) => ({
      id: a._id.toString(),
      date: a.date,
      time: a.time,
      status: a.status,
      specialization: getSpecialtyLabel(a.specialty),
    })),
    prescriptions: prescriptions.map((p) => ({
      id: p._id.toString(),
      date: p.createdAt.toLocaleDateString(),
      doctorName: p.doctorName,
      medicines: p.medicines,
      instructions: p.instructions,
    })),
    reports,
    aiScans: scans,
    timeline: await getPatientTimeline(patientId),
  };
}

export async function getDoctorAnalytics(doctorId: string) {
  const appointments = await Appointment.find({ doctorId });
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  const completed = appointments.filter((a) => a.status === "completed").length;
  const total = appointments.length || 1;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const patientGrowth = months.map((m, i) => ({
    month: m,
    patients: Math.max(1, Math.floor((i + 1) * (completed / 6) + 2)),
  }));

  const consultTrend = months.map((m, i) => ({
    month: m,
    consultations: appointments.filter((a) => a.createdAt.getMonth() % 6 === i).length,
  }));

  return {
    completionRate: Math.round((completed / total) * 100),
    specialty: profile ? getSpecialtyLabel(profile.specialty) : "—",
    rating: profile?.rating ?? 4.8,
    reviewCount: profile?.reviewCount ?? 0,
    patientGrowth,
    consultationTrend: consultTrend,
    appointmentStatus: [
      { status: "completed", count: completed },
      { status: "pending", count: appointments.filter((a) => a.status === "pending").length },
      { status: "confirmed", count: appointments.filter((a) => a.status === "confirmed").length },
      { status: "cancelled", count: appointments.filter((a) => a.status === "cancelled").length },
    ],
  };
}

export async function listAdminUsers() {
  const users = await User.find()
    .select("name email role phone location healthScore createdAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    location: u.location,
    healthScore: u.healthScore,
    joined: u.createdAt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
  }));
}

export async function listAdminDoctors(status?: "pending" | "approved" | "rejected" | "all") {
  const doctors = await User.find({ role: "doctor" }).sort({ createdAt: -1 }).lean();
  const results = [];
  for (const d of doctors) {
    const profile = await DoctorProfile.findOne({ userId: d._id }).lean();
    if (!profile) continue;
    if (status && status !== "all" && profile.verificationStatus !== status) continue;
    results.push({
      id: d._id.toString(),
      name: d.name,
      email: d.email,
      phone: d.phone,
      specialty: getSpecialtyLabel(profile.specialty),
      specialtyId: profile.specialty,
      licenseNumber: profile.licenseNumber,
      bio: profile.bio,
      rating: profile.rating ?? 4.5,
      experienceYears: profile.experienceYears ?? 0,
      verified: profile.verified,
      verificationStatus: profile.verificationStatus,
      certificateUrl: profile.certificateUrl,
      rejectionReason: profile.rejectionReason,
      submittedAt: profile.createdAt,
      reviewedAt: profile.reviewedAt,
    });
  }
  return results;
}

export async function approveDoctorRegistration(doctorId: string) {
  const user = await User.findById(doctorId);
  if (!user || user.role !== "doctor") throw new Error("Doctor not found");

  const profile = await DoctorProfile.findOne({ userId: doctorId });
  if (!profile) throw new Error("Doctor profile not found");
  if (profile.verificationStatus === "approved") {
    return { id: doctorId, verificationStatus: "approved" as const };
  }

  profile.verificationStatus = "approved";
  profile.verified = true;
  profile.rejectionReason = undefined;
  profile.reviewedAt = new Date();
  await profile.save();

  await Notification.create({
    userId: doctorId,
    type: "appointment",
    title: "Registration approved",
    message: "Your doctor account is now live. Patients can book consultations with you.",
  });

  return { id: doctorId, verificationStatus: "approved" as const };
}

export async function rejectDoctorRegistration(doctorId: string, reason?: string) {
  const user = await User.findById(doctorId);
  if (!user || user.role !== "doctor") throw new Error("Doctor not found");

  const profile = await DoctorProfile.findOne({ userId: doctorId });
  if (!profile) throw new Error("Doctor profile not found");

  if (profile.certificatePublicId) {
    try {
      const { isCloudinaryConfigured, applyCloudinaryConfig } = await import(
        "../../integrations/cloudinary.service.js"
      );
      if (isCloudinaryConfigured() && applyCloudinaryConfig()) {
        const { v2: cloudinary } = await import("cloudinary");
        await cloudinary.uploader.destroy(profile.certificatePublicId);
      }
    } catch {
      /* non-fatal */
    }
  }

  await DoctorProfile.deleteOne({ userId: doctorId });
  await User.findByIdAndDelete(doctorId);

  return {
    id: doctorId,
    verificationStatus: "rejected" as const,
    message: reason?.trim() || "Registration rejected — doctor must register again",
  };
}

export async function listAdminPatients() {
  const patients = await User.find({ role: "patient" }).sort({ createdAt: -1 }).lean();
  return patients.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    email: p.email,
    phone: p.phone,
    location: p.location,
    healthScore: p.healthScore ?? 82,
    condition: p.chronicDiseases?.[0] ?? "General",
    riskLevel:
      (p.healthScore ?? 82) < 60 ? "high" : (p.healthScore ?? 82) < 75 ? "medium" : "low",
  }));
}

export async function getAdminAiMonitoring() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [scansToday, urgentCases, totalScans, recentScans, critical] = await Promise.all([
    SymptomScan.countDocuments({ createdAt: { $gte: today } }),
    SymptomScan.countDocuments({ emergency: true, createdAt: { $gte: weekAgo } }),
    SymptomScan.countDocuments(),
    SymptomScan.find({ createdAt: { $gte: weekAgo } }).lean(),
    SymptomScan.find({ emergency: true }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const symptomCounts: Record<string, number> = {};
  for (const s of recentScans) {
    for (const sym of s.symptoms ?? []) {
      symptomCounts[sym] = (symptomCounts[sym] ?? 0) + 1;
    }
  }
  const symptomTrends = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([symptom, count]) => ({ symptom, count }));

  return {
    stats: { scansToday, urgentCases, totalScans },
    symptomTrends,
    criticalAlerts: critical.map((c) => ({
      id: c._id.toString(),
      risk: c.risk,
      symptoms: c.symptoms?.join(", ") ?? "",
    })),
  };
}

export async function getAdminDashboard() {
  const [patients, doctors, appointments, scans, emergencies, pendingDoctors, liveDoctors] =
    await Promise.all([
      User.countDocuments({ role: "patient" }),
      User.countDocuments({ role: "doctor" }),
      Appointment.countDocuments(),
      SymptomScan.countDocuments(),
      SymptomScan.countDocuments({ emergency: true }),
      DoctorProfile.countDocuments({ verificationStatus: "pending" }),
      DoctorProfile.countDocuments({ verificationStatus: "approved", verified: true }),
    ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appointmentsToday = await Appointment.countDocuments({ createdAt: { $gte: today } });
  const scansToday = await SymptomScan.countDocuments({ createdAt: { $gte: today } });

  const critical = await SymptomScan.find({ emergency: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const pendingList = await DoctorProfile.find({ verificationStatus: "pending" })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const pendingPreview = [];
  for (const p of pendingList) {
    const u = await User.findById(p.userId);
    if (!u) continue;
    pendingPreview.push({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      specialty: getSpecialtyLabel(p.specialty),
      licenseNumber: p.licenseNumber,
      certificateUrl: p.certificateUrl,
      submittedAt: p.createdAt,
    });
  }

  return {
    stats: {
      totalUsers: patients + doctors + (await User.countDocuments({ role: "admin" })),
      activeDoctors: liveDoctors,
      pendingDoctorApplications: pendingDoctors,
      totalPatients: patients,
      appointmentsToday,
      aiScansToday: scansToday,
      totalConsultations: appointments,
      emergencyCases: emergencies,
    },
    pendingDoctorApplications: pendingPreview,
    systemHealth: {
      api: "operational",
      database: "connected",
      aiService: "operational",
      uptimePercent: 99.2,
    },
    criticalAlerts: critical.map((c) => ({
      id: c._id.toString(),
      risk: c.risk,
      symptoms: c.symptoms?.join(", "),
      at: c.createdAt,
    })),
    recentAiScans: scans,
  };
}

async function formatApptList(
  list: {
    _id: { toString(): string };
    patientId: { toString(): string };
    doctorId: { toString(): string };
    date: string;
    time: string;
    status: string;
    specialty: string;
  }[],
) {
  const results = [];
  for (const a of list) {
    const patient = await User.findById(a.patientId.toString());
    const doctor = await User.findById(a.doctorId.toString());
    results.push({
      id: a._id.toString(),
      patientId: a.patientId.toString(),
      patientName: patient?.name,
      doctorId: a.doctorId.toString(),
      doctorName: doctor?.name,
      date: a.date,
      time: a.time,
      status: a.status,
      specialization: getSpecialtyLabel(a.specialty),
      specialty: a.specialty,
    });
  }
  return results;
}
