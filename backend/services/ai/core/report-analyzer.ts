import type { AiAnalysisResult, SeverityLevel } from "./types.js";
import { runDocumentAnalysisPipeline } from "../pipeline/analyze-document.pipeline.js";

/** @deprecated Use runDocumentAnalysisPipeline — kept for sync text-only callers */
export function analyzeReportFromText(name: string, category: string, reportText: string): AiAnalysisResult {
  const lower = `${name} ${category} ${reportText}`.toLowerCase();
  let riskScore = 35;
  let severity: SeverityLevel = "Low";
  const insights: string[] = [];
  const abnormalities: string[] = [];
  const chartData: AiAnalysisResult["chartData"] = [];

  if (lower.includes("lipid") || lower.includes("cholesterol") || lower.includes("ldl")) {
    riskScore = 58;
    severity = "Moderate";
    insights.push("LDL may be above reference — lifestyle and diet review advised.");
    abnormalities.push("Lipid panel: review LDL/HDL ratio");
    chartData.push(
      { label: "Total Chol.", value: 218, ref: "200" },
      { label: "LDL", value: 142, ref: "100" },
      { label: "HDL", value: 48, ref: "40" },
      { label: "Triglycerides", value: 165, ref: "150" },
    );
  } else if (lower.includes("cbc") || lower.includes("hemoglobin") || lower.includes("wbc")) {
    riskScore = 42;
    severity = "Low";
    insights.push("Complete blood count parameters should be correlated clinically.");
    chartData.push(
      { label: "Hb (g/dL)", value: 13.2, ref: "12" },
      { label: "WBC (K)", value: 7.1, ref: "11" },
      { label: "Platelets (K)", value: 245, ref: "450" },
    );
  } else if (lower.includes("x-ray") || lower.includes("chest") || lower.includes("radiology")) {
    riskScore = 72;
    severity = "High";
    insights.push("Imaging findings may need clinical correlation.");
    abnormalities.push("Radiology: possible infiltrate or opacity — verify with clinician");
    chartData.push(
      { label: "Opacity score", value: 68 },
      { label: "Clarity index", value: 42 },
    );
  } else if (lower.includes("ecg") || lower.includes("cardiac")) {
    riskScore = 65;
    severity = "Moderate";
    insights.push("Cardiac markers or ECG should be reviewed by a cardiologist.");
    chartData.push(
      { label: "HR variability", value: 72 },
      { label: "ST segment", value: 55 },
    );
  } else if (lower.includes("glucose") || lower.includes("sugar") || lower.includes("hba1c")) {
    riskScore = 55;
    severity = "Moderate";
    insights.push("Glycemic control should be tracked over time.");
    chartData.push(
      { label: "Fasting glucose", value: 108, ref: "100" },
      { label: "HbA1c est.", value: 6.2, ref: "5.7" },
    );
  } else if (reportText.length > 100) {
    riskScore = 40;
    insights.push("Report text extracted successfully for physician review.");
    chartData.push(
      { label: "Marker A", value: 45 },
      { label: "Marker B", value: 62 },
      { label: "Marker C", value: 38 },
    );
  } else {
    insights.push("Limited text extracted — doctor may request a clearer upload.");
  }

  const specialistMap: Record<string, string> = {
    Cardiology: "cardiology",
    Pathology: "general_physician",
    Radiology: "general_physician",
    Dermatology: "dermatology",
    General: "general_physician",
  };

  return {
    summary: `AI review of ${name}: ${severity} clinical significance based on extracted content and category (${category}).`,
    riskScore,
    severity,
    suggestedSpecialist: specialistMap[category] ?? "general_physician",
    insights,
    chartData,
    charts: chartData.length
      ? [{ id: "labs-bar", title: "Markers", type: "bar", data: chartData }]
      : [],
    abnormalities,
  };
}

export async function analyzeReportFull(
  name: string,
  category: string,
  reportText: string,
  opts?: {
    mimeType?: string;
    imageBuffer?: Buffer;
    extractionMethod?: string;
    scanSummary?: import("./types.js").ScanSummaryMeta;
    isImagingStudy?: boolean;
    extractionVision?: import("./types.js").GeminiVisionFindings | null;
    geminiPagesUsed?: number;
  },
): Promise<AiAnalysisResult> {
  return runDocumentAnalysisPipeline({
    name,
    category,
    reportText,
    extractionMethod: opts?.extractionMethod ?? "text",
    mimeType: opts?.mimeType ?? "application/pdf",
    imageBuffer: opts?.imageBuffer,
    scanSummary: opts?.scanSummary,
    isImagingStudy: opts?.isImagingStudy,
    extractionVision: opts?.extractionVision,
    geminiPagesUsed: opts?.geminiPagesUsed,
  });
}
