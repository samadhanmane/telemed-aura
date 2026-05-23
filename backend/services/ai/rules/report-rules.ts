import type { RuleAnalysisPartial } from "../core/types.js";
import { detectConditionsFromText } from "./disease-severity.rules.js";
import { extractLabValuesFromText } from "./lab-value-extractor.js";
import { extractSymptomsFromReportText } from "./symptom-extractor.js";
import {
  filterKeywordConditions,
  inferConditionsFromLabs,
} from "./clinical-inference.js";
import { detectCriticalLabComment } from "./cbc-lab-parser.js";
import { normalizeMedicalReportText } from "../extraction/text-normalize.js";

export function analyzeReportWithRules(
  name: string,
  category: string,
  reportText: string,
): RuleAnalysisPartial {
  const normalizedText = normalizeMedicalReportText(reportText);
  const lower = `${name} ${category} ${normalizedText}`.toLowerCase();
  const { vitals, chartData, charts, markers } = extractLabValuesFromText(normalizedText);
  const { severe, moderate } = detectConditionsFromText(normalizedText);
  const symptoms = extractSymptomsFromReportText(normalizedText);

  const { accepted: kwAccepted, rejected: keywordRejected } = filterKeywordConditions(
    normalizedText,
    [...severe, ...moderate],
    markers,
  );

  const inferred = inferConditionsFromLabs(markers, symptoms);
  const detectedConditions = [
    ...new Set([
      ...inferred.map((i) => i.name),
      ...kwAccepted,
    ]),
  ];

  const insights: string[] = [];
  const abnormalities: string[] = [];
  let documentType = "general";

  if (
    category.toLowerCase().includes("x-ray") ||
    lower.includes("x-ray") ||
    lower.includes("xray") ||
    lower.includes("chest pa") ||
    lower.includes("radiograph") ||
    lower.includes("pneumonia") ||
    /\bbacteria\b/.test(lower) ||
    /\.jpe?g|\.png/.test(lower)
  ) {
    documentType = "xray";
    insights.push("Radiology/image study — clinical verdict should come from AI vision of the film, not OCR labs.");
  } else if (category.toLowerCase().includes("ct") || lower.includes("ct scan")) {
    documentType = "ct_scan";
    insights.push("CT study — specialist interpretation recommended.");
  } else if (category.toLowerCase().includes("ecg") || lower.includes("electrocardiogram")) {
    documentType = "ecg";
    insights.push("ECG/cardiac report detected.");
  } else if (
    category.toLowerCase().includes("pathology") ||
    category.toLowerCase().includes("blood") ||
    lower.includes("hemoglobin") ||
    lower.includes("cbc") ||
    lower.includes("wbc") ||
    markers.some((m) => ["Hemoglobin", "WBC", "Platelets"].includes(m.test))
  ) {
    documentType = "lab_report";
    insights.push(
      markers.length
        ? `Parsed ${markers.length} lab value(s) from report text.`
        : "CBC/lab report detected but numeric values were not extracted — check scan quality.",
    );
  } else if (lower.includes("prescription") || lower.includes("rx")) {
    documentType = "prescription";
  }

  for (const note of detectCriticalLabComment(normalizedText)) {
    abnormalities.push(note);
    insights.push(note);
  }
  for (const m of markers.filter((x) => x.status === "critical")) {
    abnormalities.push(`Critical: ${m.test} ${m.value} ${m.unit}`);
  }

  for (const inf of inferred) {
    abnormalities.push(...inf.evidence.map((e) => `${inf.name}: ${e}`));
  }
  for (const r of keywordRejected) {
    insights.push(r.reason);
  }
  if (markers.length === 0 && reportText.length < 120) {
    insights.push("Limited readable text — re-upload a clearer PDF or photo.");
    abnormalities.push("Low extraction confidence");
  }

  if (symptoms.length) {
    insights.push(`Document mentions: ${symptoms.join(", ")}.`);
  }

  const riskChart = {
    id: "risk-gauge",
    title: "Screening risk index",
    type: "risk" as const,
    data: [{ label: "Index", value: 0 }],
  };

  return {
    extractedVitals: vitals,
    detectedConditions,
    abnormalities,
    chartData,
    charts: [...charts, riskChart],
    insights,
    documentType,
    labMarkers: markers,
    inferredConditions: inferred,
    keywordRejected,
    symptomsFromReport: symptoms,
  };
}
