import {
  Appointment,
  MedicalReport,
  SymptomScan,
  Notification,
  User,
  DoctorProfile,
  PrescriptionUpload,
} from "../../database/models/index.js";
import { getSpecialtyLabel } from "../../constants/specialties.js";
import {
  parsePrescriptionText,
  analyzeReportFull,
  calculateVitalsRisk,
} from "../../../services/ai/core/index.js";
import { runSymptomAnalysisPipeline } from "../../../services/ai/pipeline/analyze-symptom.pipeline.js";
import type { AiAnalysisResult } from "../../../services/ai/core/types.js";
import { runPrescriptionAnalysisPipeline } from "../../../services/ai/pipeline/index.js";
import { uploadToCloudinaryAndExtract } from "../../integrations/media.pipeline.js";
import { ingestExtractedDocument } from "../../../services/ai/chatbot/indexing/ingest-document.js";
import { runMedicalRagPipeline } from "../../../services/ai/chatbot/pipeline/rag-pipeline.js";

export async function runSymptomScan(
  patientId: string,
  input: {
    symptoms: string[];
    description?: string;
    bodyArea?: string;
    age?: number;
    chronicDiseases?: string[];
    vitals?: {
      bloodPressureSystolic?: number;
      bloodPressureDiastolic?: number;
      sugarLevel?: number;
      oxygenLevel?: number;
    };
    locale?: "en" | "hi";
  },
) {
  const user = await User.findById(patientId);
  const locale = input.locale ?? "en";
  const analysis = await runSymptomAnalysisPipeline({
    symptoms: input.symptoms,
    description: input.description,
    bodyArea: input.bodyArea,
    age: input.age ?? user?.age,
    chronicDiseases: input.chronicDiseases ?? user?.chronicDiseases,
    vitals: input.vitals,
  });

  if (locale === "hi") {
    const { localizeMedicalAnswer } = await import(
      "../../../services/ai/i18n/translator.js"
    );
    const q = [input.description, ...(input.symptoms ?? [])].filter(Boolean).join("; ");
    analysis.recommendation = await localizeMedicalAnswer(
      analysis.recommendation,
      "hi",
      q || "symptom scan",
    );
    if (analysis.patientProblemSummary) {
      analysis.patientProblemSummary = await localizeMedicalAnswer(
        analysis.patientProblemSummary,
        "hi",
        q || "symptom scan",
      );
    }
    if (analysis.preventiveSuggestions?.length) {
      analysis.preventiveSuggestions = await Promise.all(
        analysis.preventiveSuggestions.map((s) =>
          localizeMedicalAnswer(s, "hi", q || "symptom scan"),
        ),
      );
    }
  }

  const scan = await SymptomScan.create({
    patientId,
    symptoms: input.symptoms,
    description: input.description,
    bodyArea: input.bodyArea,
    risk: analysis.risk,
    severity: analysis.severity,
    possibleConditions: analysis.possibleConditions,
    suggestedSpecialist: analysis.suggestedSpecialist,
    emergency: analysis.emergency,
  });

  const { computeWellnessScoreFromScan } = await import(
    "../../../services/ai/core/health-score.js"
  );
  const nextHealthScore = computeWellnessScoreFromScan({
    previousScore: user?.healthScore ?? 82,
    scanRisk: analysis.risk,
    severity: analysis.severity,
  });
  await User.findByIdAndUpdate(patientId, { healthScore: nextHealthScore }).catch(() => undefined);

  const { recordVitals } = await import("../emr/emr.service.js");
  const v = input.vitals;
  if (v) {
    await recordVitals(patientId, {
      source: "ai_scan",
      bloodPressureSystolic: v.bloodPressureSystolic,
      bloodPressureDiastolic: v.bloodPressureDiastolic,
      sugarLevel: v.sugarLevel,
      oxygenLevel: v.oxygenLevel,
      note: "From AI symptom scan",
    }).catch(() => undefined);
  }

  const { onSymptomScanCritical, isCriticalSeverity } =
    await import("../clinical/critical-care.service.js");
  const snap = {
    patientId,
    patientName: user?.name ?? "Patient",
    riskScore: analysis.risk,
    severity: analysis.severity as "Low" | "Moderate" | "High" | "Critical",
    emergency: analysis.emergency,
    reasons: [analysis.recommendation],
    healthScore: user?.healthScore ?? 82,
    priorityScore: analysis.risk,
  };
  let criticalAlertId: string | undefined;
  if (isCriticalSeverity(snap)) {
    const alert = await onSymptomScanCritical(patientId, scan._id.toString(), {
      severity: analysis.severity,
      risk: analysis.risk,
      emergency: analysis.emergency,
      recommendation: analysis.recommendation,
    });
    criticalAlertId = alert?._id.toString();
  } else if (analysis.emergency) {
    await Notification.create({
      userId: patientId,
      type: "emergency",
      title: "Emergency health alert",
      message: analysis.recommendation,
      meta: { scanId: scan._id.toString(), triagePriority: analysis.triagePriority },
    });
  } else if (analysis.risk >= 60) {
    await Notification.create({
      userId: patientId,
      type: "ai_alert",
      title: "AI health alert",
      message: `Elevated risk (${analysis.risk}%). ${analysis.recommendation}`,
      meta: { scanId: scan._id.toString(), triagePriority: analysis.triagePriority },
    });
  }

  let nearestDoctor = null;
  if (analysis.emergency || isCriticalSeverity(snap)) {
    const profile = await DoctorProfile.findOne({
      specialty: analysis.suggestedSpecialtyId,
      verified: true,
      verificationStatus: "approved",
    });
    if (profile) {
      const doc = await User.findById(profile.userId);
      if (doc) {
        nearestDoctor = {
          id: doc._id.toString(),
          name: doc.name,
          specialty: getSpecialtyLabel(profile.specialty),
          rating: profile.rating,
        };
      }
    }
  }

  return {
    id: scan._id.toString(),
    ...analysis,
    nearestDoctor,
    criticalAlertId,
    isCritical: isCriticalSeverity(snap),
    canBookUrgentCall: Boolean(criticalAlertId),
  };
}

export async function getHealthSummary(patientId: string) {
  const user = await User.findById(patientId);
  const reports = await MedicalReport.find({ patientId }).sort({ createdAt: -1 }).limit(5);
  const scans = await SymptomScan.find({ patientId }).sort({ createdAt: -1 }).limit(5);
  const appointments = await Appointment.find({ patientId, status: "completed" }).countDocuments();

  const reportRisks = reports.filter((r) => r.aiAnalysis).map((r) => r.aiAnalysis!.riskScore);
  const scanRisks = scans.map((s) => s.risk);
  const allRisks = [...reportRisks, ...scanRisks];
  let computedRisk = user?.healthScore ?? 82;
  if (allRisks.length) {
    computedRisk = Math.round(allRisks.reduce((a, b) => a + b, 0) / allRisks.length);
  }

  const lines: string[] = [];
  if (computedRisk >= 65) {
    lines.push("You may be showing elevated health risk based on recent scans and reports.");
    lines.push("Recommended: specialist consultation within the next week.");
  } else if (computedRisk >= 45) {
    lines.push("Your health indicators are mostly stable with a few areas to monitor.");
    lines.push("Recommended: follow up with your general physician.");
  } else {
    lines.push("Your health score is stable today. Keep up regular check-ups.");
  }

  if (user?.chronicDiseases?.length) {
    lines.push(`Managing: ${user.chronicDiseases.join(", ")}.`);
  }

  const highReport = reports.find((r) => r.aiAnalysis && r.aiAnalysis.severity === "High");
  if (highReport) {
    lines.push(`${highReport.name} flagged for review — discuss with your doctor.`);
  }

  const latestScan = scans[0];
  if (latestScan?.emergency) {
    lines.push("Recent symptom scan flagged emergency indicators.");
  }

  return {
    healthScore: user?.healthScore ?? 82,
    computedRisk,
    summary: lines.join(" "),
    suggestions: analysisPreventiveTips(computedRisk),
    consultationsCompleted: appointments,
    recentScans: scans.length,
    reportsOnFile: reports.length,
    lastTriagePriority: latestScan ? severityToPriorityNum(latestScan.severity, latestScan.emergency) : null,
  };
}

function severityToPriorityNum(severity: string, emergency: boolean): number {
  if (emergency || severity === "Critical") return 1;
  if (severity === "High") return 2;
  if (severity === "Moderate") return 3;
  return 4;
}

function analysisPreventiveTips(risk: number) {
  const tips = [
    "Stay hydrated — 8 glasses of water daily.",
    "Take short walks after meals for better circulation.",
  ];
  if (risk >= 60) {
    tips.push("Avoid strenuous activity until reviewed by a doctor.");
    tips.push("Monitor blood pressure if you have a home kit.");
  }
  return tips;
}

export function analyzePrescriptionOcr(text: string) {
  return parsePrescriptionText(text);
}

export async function analyzeAndStorePrescriptionUpload(
  patientId: string,
  data: { buffer: Buffer; mimeType: string; originalName: string },
) {
  const { resetUploadGeminiCounters, logUploadGeminiSummary } = await import(
    "../../../services/ai/models/gemini-usage.js"
  );
  const { beginUploadGeminiBudget } = await import(
    "../../../services/ai/models/gemini-rate-manager.js"
  );
  resetUploadGeminiCounters();
  beginUploadGeminiBudget(true);

  const media = await uploadToCloudinaryAndExtract(data.buffer, {
    folder: `telemed-aura/prescriptions/${patientId}`,
    filename: data.originalName,
    mimeType: data.mimeType,
    category: "Prescription",
    /** Tesseract/pdf text only as hint — Rx parsing is Gemini vision in pipeline. */
    allowGeminiVision: false,
  });

  const parsed = await runPrescriptionAnalysisPipeline({
    extractedText: media.extractedText,
    extractionMethod: media.extractionMethod,
    mimeType: data.mimeType,
    filename: data.originalName,
    imageBuffer:
      data.mimeType.startsWith("image/") || data.mimeType === "application/pdf"
        ? data.buffer
        : undefined,
  });

  const record = await PrescriptionUpload.create({
    patientId,
    originalName: data.originalName,
    mimeType: data.mimeType,
    fileUrl: media.secureUrl,
    cloudinaryPublicId: media.publicId,
    ocrText: parsed.text,
    ocrConfidence: parsed.confidence,
    medicines: parsed.medicines,
    scanSummary: media.extraction.scan_summary as Record<string, unknown> | undefined,
    pageCount: media.extraction.page_count,
    extractionMethod: parsed.extractionMethod ?? media.extractionMethod,
  });

  await ingestExtractedDocument({
    patientId,
    documentId: record._id.toString(),
    filename: data.originalName,
    sourceType: "prescription",
    extraction: media.extraction,
  }).catch((err) => console.warn("[rag] prescription ingest failed:", err));

  logUploadGeminiSummary("Prescription upload");

  return {
    ...parsed,
    extractionMethod: media.extractionMethod,
    fileUrl: media.secureUrl,
    uploadId: record._id.toString(),
    scanSummary: media.extraction.scan_summary,
    pageCount: media.extraction.page_count,
  };
}

export async function uploadAndAnalyzeReport(
  patientId: string,
  data: { name: string; category: string; buffer: Buffer; mimeType: string; originalName: string },
) {
  const { resetUploadGeminiCounters, logUploadGeminiSummary } = await import(
    "../../../services/ai/models/gemini-usage.js"
  );
  const { beginUploadGeminiBudget } = await import(
    "../../../services/ai/models/gemini-rate-manager.js"
  );
  resetUploadGeminiCounters();
  beginUploadGeminiBudget(true);

  const media = await uploadToCloudinaryAndExtract(data.buffer, {
    folder: `telemed-aura/reports/${patientId}`,
    filename: data.originalName,
    mimeType: data.mimeType,
    category: data.category,
    allowGeminiVision: true,
  });

  const scanSummary = media.extraction.scan_summary;

  const aiAnalysis = await analyzeReportFull(data.name, data.category, media.extractedText, {
    mimeType: data.mimeType,
    imageBuffer: data.mimeType.startsWith("image/") ? data.buffer : undefined,
    extractionMethod: media.extractionMethod,
    scanSummary,
    isImagingStudy: media.extraction.is_imaging_study,
    extractionVision: media.extraction.vision_findings ?? null,
    geminiPagesUsed: media.extraction.gemini_pages_used ?? 0,
  });

  const uploadDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const report = await MedicalReport.create({
    patientId,
    name: data.name,
    type: media.reportType,
    category: data.category,
    uploadDate,
    fileUrl: media.secureUrl,
    cloudinaryPublicId: media.publicId,
    aiAnalysis: mapAnalysisToSchema(aiAnalysis, {
      extractionMethod: media.extractionMethod,
      pageCount: media.extraction.page_count,
      scanSummary,
      chunksIndexed: 0,
    }),
  });

  let ingestResult = { chunkCount: 0 };
  try {
    ingestResult = await ingestExtractedDocument({
      patientId,
      documentId: report._id.toString(),
      filename: data.name || data.originalName,
      sourceType: "report",
      extraction: media.extraction,
    });
    if (ingestResult.chunkCount > 0) {
      await MedicalReport.updateOne(
        { _id: report._id },
        { $set: { "aiAnalysis.pipeline.chunksIndexed": ingestResult.chunkCount } },
      );
      if (report.aiAnalysis?.pipeline) {
        (report.aiAnalysis.pipeline as { chunksIndexed?: number }).chunksIndexed =
          ingestResult.chunkCount;
      }
    }
  } catch (err) {
    console.warn("[rag] report ingest failed:", err);
  }

  const ev = aiAnalysis.extractedVitals;
  if (ev && (ev.bloodPressureSystolic || ev.fastingGlucose || ev.randomGlucose)) {
    const { recordVitals } = await import("../emr/emr.service.js");
    await recordVitals(patientId, {
      source: "emr_update",
      bloodPressureSystolic: ev.bloodPressureSystolic,
      bloodPressureDiastolic: ev.bloodPressureDiastolic,
      sugarLevel: ev.fastingGlucose ?? ev.randomGlucose,
      note: `From report: ${data.name}`,
    }).catch(() => undefined);
  }

  if (aiAnalysis.severity === "High" || aiAnalysis.severity === "Critical") {
    await Notification.create({
      userId: patientId,
      type: "report",
      title: "Report needs attention",
      message: `${data.name}: ${aiAnalysis.summary.slice(0, 120)}`,
      meta: { reportId: report._id.toString() },
    });
  }

  logUploadGeminiSummary("Report upload");

  return {
    report: formatReport(report.toObject() as Parameters<typeof formatReport>[0]),
    extractionMethod: media.extractionMethod,
    pageCount: media.extraction.page_count,
    scanSummary,
    chunkIndexed: ingestResult?.chunkCount ?? 0,
    extractedTextPreview: media.extractedText.slice(0, 500),
  };
}

export async function chatWithDocuments(
  patientId: string,
  input: { question: string; reportIds?: string[]; locale?: "en" | "hi" },
) {
  const { beginChatGeminiBudget } = await import(
    "../../../services/ai/models/gemini-rate-manager.js"
  );
  beginChatGeminiBudget();

  const user = await User.findById(patientId).lean();
  const ctx = user?.chronicDiseases?.length
    ? `Chronic conditions: ${user.chronicDiseases.join(", ")}`
    : undefined;

  return runMedicalRagPipeline({
    patientId,
    question: input.question,
    reportIds: input.reportIds,
    patientContext: ctx,
    locale: input.locale ?? "en",
  });
}

export async function listPrescriptionUploads(patientId: string) {
  const list = await PrescriptionUpload.find({ patientId }).sort({ createdAt: -1 }).lean();
  return list.map((u) => ({
    id: u._id.toString(),
    originalName: u.originalName,
    fileUrl: u.fileUrl,
    mimeType: u.mimeType,
    ocrText: u.ocrText,
    ocrConfidence: u.ocrConfidence,
    medicines: u.medicines,
    createdAt: u.createdAt,
  }));
}

function mapAnalysisToSchema(
  a: AiAnalysisResult,
  extra?: {
    extractionMethod?: string;
    pageCount?: number;
    scanSummary?: import("../../../services/ai/extraction/types.js").ScanSummary;
    chunksIndexed?: number;
  },
) {
  return {
    patientProblemSummary: a.patientProblemSummary,
    clinicalBrief: a.clinicalBrief,
    finalVerdict: a.finalVerdict,
    assessmentBasis: a.assessmentBasis,
    symptomsFromReport: a.symptomsFromReport,
    possibleDiseases: a.possibleDiseases,
    keyLabFindings: a.keyLabFindings,
    analysisDetails: a.analysisDetails,
    summary: a.summary,
    riskScore: a.riskScore,
    severity: a.severity,
    suggestedSpecialist: a.suggestedSpecialist,
    insights: a.insights,
    chartData: a.chartData,
    charts: a.charts ?? [],
    abnormalities: a.abnormalities,
    guidance: a.guidance,
    extractedVitals: a.extractedVitals,
    pipeline: a.pipeline
      ? {
          extractionMethod: extra?.extractionMethod ?? a.pipeline.extractionMethod,
          pageCount: extra?.pageCount ?? extra?.scanSummary?.totalPages,
          scanSummary: extra?.scanSummary ?? a.pipeline.scanSummary,
          chunksIndexed: extra?.chunksIndexed ?? a.pipeline.chunksIndexed,
          visionUsed: a.pipeline.visionUsed,
          synthesisUsed: a.pipeline.synthesisUsed,
          mlUsed: a.pipeline.mlUsed,
          detectedConditions: a.pipeline.detectedConditions,
          documentType: a.pipeline.documentType,
          remarkAdjusted: a.pipeline.remarkAdjusted,
          geminiQuotaLimited: a.pipeline.geminiQuotaLimited,
          ruleConfidence: a.pipeline.ruleConfidence,
          geminiVerdictPrimary: a.pipeline.geminiVerdictPrimary,
          geminiRuleAgreement: a.pipeline.geminiRuleAgreement,
        }
      : extra
        ? {
            extractionMethod: extra.extractionMethod,
            pageCount: extra.pageCount,
            scanSummary: extra.scanSummary,
            visionUsed: false,
            synthesisUsed: false,
            mlUsed: false,
            detectedConditions: [],
          }
        : undefined,
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
  aiAnalysis?: Record<string, unknown>;
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

export { calculateVitalsRisk };
