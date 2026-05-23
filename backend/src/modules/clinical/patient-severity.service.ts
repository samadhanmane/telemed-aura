import { User, MedicalReport, SymptomScan } from "../../database/models/index.js";

export type SeverityLevel = "Low" | "Moderate" | "High" | "Critical";

const SEVERITY_RANK: Record<SeverityLevel, number> = {
  Low: 1,
  Moderate: 2,
  High: 3,
  Critical: 4,
};

export type PatientSeveritySnapshot = {
  patientId: string;
  patientName: string;
  riskScore: number;
  severity: SeverityLevel;
  emergency: boolean;
  reasons: string[];
  suggestedSpecialist?: string;
  healthScore: number;
  priorityScore: number;
};

function maxSeverity(a: SeverityLevel, b: SeverityLevel): SeverityLevel {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

function severityFromString(s: string | undefined): SeverityLevel {
  if (s === "Critical" || s === "High" || s === "Moderate" || s === "Low") return s;
  return "Low";
}

/** Unified criticality from AI scans, reports, and profile (for triage queue). */
export async function getPatientSeveritySnapshot(
  patientId: string,
): Promise<PatientSeveritySnapshot> {
  const user = await User.findById(patientId);
  if (!user || user.role !== "patient") {
    throw new Error("Patient not found");
  }

  const [latestScan, latestReport] = await Promise.all([
    SymptomScan.findOne({ patientId }).sort({ createdAt: -1 }).lean(),
    MedicalReport.findOne({ patientId, aiAnalysis: { $exists: true } })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  let severity: SeverityLevel = "Low";
  let riskScore = Math.max(0, Math.min(100, 100 - (user.healthScore ?? 82)));
  let emergency = false;
  const reasons: string[] = [];

  if (latestScan) {
    const scanSev = severityFromString(latestScan.severity);
    severity = maxSeverity(severity, scanSev);
    riskScore = Math.max(riskScore, latestScan.risk ?? 0);
    if (latestScan.emergency) {
      emergency = true;
      severity = "Critical";
      riskScore = Math.max(riskScore, 92);
    }
    reasons.push(
      `AI symptom scan (${latestScan.severity}, risk ${latestScan.risk}%): ${latestScan.symptoms?.slice(0, 3).join(", ") || "—"}`,
    );
  }

  if (latestReport?.aiAnalysis) {
    const ra = latestReport.aiAnalysis;
    const repSev = severityFromString(ra.severity);
    severity = maxSeverity(severity, repSev);
    riskScore = Math.max(riskScore, ra.riskScore ?? 0);
    reasons.push(`Report "${latestReport.name}" — ${ra.severity} (${ra.riskScore}% risk)`);
  }

  if ((user.healthScore ?? 82) < 55) {
    severity = maxSeverity(severity, "High");
    riskScore = Math.max(riskScore, 70);
    reasons.push(`Low health score (${user.healthScore})`);
  } else if ((user.healthScore ?? 82) < 70) {
    severity = maxSeverity(severity, "Moderate");
    riskScore = Math.max(riskScore, 50);
  }

  if (user.chronicDiseases?.length) {
    reasons.push(`Chronic: ${user.chronicDiseases.join(", ")}`);
    if (severity === "Low") severity = "Moderate";
  }

  const priorityScore =
    SEVERITY_RANK[severity] * 25 +
    Math.min(25, Math.round(riskScore / 4)) +
    (emergency ? 30 : 0);

  return {
    patientId,
    patientName: user.name,
    riskScore: Math.min(100, Math.round(riskScore)),
    severity,
    emergency,
    reasons: reasons.slice(0, 5),
    suggestedSpecialist: latestScan?.suggestedSpecialist,
    healthScore: user.healthScore ?? 82,
    priorityScore,
  };
}

export function compareSeveritySnapshots(a: PatientSeveritySnapshot, b: PatientSeveritySnapshot): number {
  return b.priorityScore - a.priorityScore;
}
