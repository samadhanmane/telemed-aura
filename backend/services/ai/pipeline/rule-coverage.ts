import type { RuleAnalysisPartial } from "../core/types.js";

export type RuleCoverageLevel = "high" | "medium" | "low";

export type RuleCoverageAssessment = {
  level: RuleCoverageLevel;
  /** When true, Gemini should drive final verdict / diseases / symptoms. */
  preferGeminiVerdict: boolean;
  reasons: string[];
};

/** Terms rules handle poorly — need clinical LLM read. */
const BROAD_CLINICAL_RE =
  /\b(cancer|carcinoma|tumor|tumour|malignan|metasta|fracture|broken bone|dislocation|sprain|strain|spinal|vertebra|disc herniation|sciatica|meniscus|ligament tear|acl|mcl|osteoporosis|osteomyelitis|arthritis|gout|pneumonia|infarct|stroke|sepsis|abscess|cellulitis|hepatitis|cirrhosis|kidney stone|renal calculi|appendicitis|gallstone|thyroid nodule|copd|asthma exacerbation|dvt|embolism|anxiety|depression|pregnancy|miscarriage)\b/i;

const IMAGING_CATEGORY =
  /x-?ray|radiology|ct\s*scan|mri|ultrasound|sonography|mammogram|ecg|ekg|imaging/i;

const LAB_CATEGORY = /blood|pathology|cbc|lab|lipid|glucose/i;

export function assessRuleCoverage(input: {
  category: string;
  reportText: string;
  rules: RuleAnalysisPartial;
  isImagingStudy?: boolean;
}): RuleCoverageAssessment {
  const reasons: string[] = [];
  const text = input.reportText;
  const markers = input.rules.labMarkers ?? [];
  const inferred = input.rules.inferredConditions ?? [];
  const symptoms = input.rules.symptomsFromReport ?? [];
  const rejected = input.rules.keywordRejected ?? [];
  const cat = input.category;
  const textLen = text.length;

  let score = 0;
  const maxScore = 6;

  const criticalMarkers = markers.filter((m) => m.status === "critical");
  if (markers.length >= 5) score += 3;
  else if (markers.length >= 2) score += 2;
  else if (markers.length === 1) score += 1;
  else reasons.push("Few or no numeric lab values were parsed from the document.");

  if (criticalMarkers.length > 0) {
    score += 1;
    reasons.push(
      `${criticalMarkers.length} critical lab flag(s) parsed — rules anchor severity; Gemini still adds clinical narrative.`,
    );
  }

  if (inferred.length > 0) score += 1;
  else if (
    markers.some(
      (m) => m.status === "low" || m.status === "high" || m.status === "critical",
    )
  )
    score += 1;
  else if (textLen > 300 && markers.length === 0) {
    reasons.push("Long report text but automated lab rules found no measurable abnormalities.");
  }

  if (symptoms.length > 0) score += 1;

  const broadClinical = BROAD_CLINICAL_RE.test(text);
  if (broadClinical) {
    reasons.push(
      "Report mentions specialized conditions (e.g. cancer, fracture, spinal, infection) that need full clinical interpretation beyond lab rules.",
    );
  }

  const isImaging =
    input.isImagingStudy ||
    IMAGING_CATEGORY.test(cat) ||
    input.rules.documentType === "xray" ||
    input.rules.documentType === "ct_scan";
  const isLab = LAB_CATEGORY.test(cat) || input.rules.documentType === "lab_report";

  if (isImaging && !isLab) {
    if (inferred.length === 0 && markers.length === 0) {
      reasons.push("Imaging/radiology report — rule engine cannot fully interpret films from text alone.");
    }
    score = Math.min(score, 2);
  }

  if (isLab && markers.length === 0 && textLen > 150) {
    reasons.push("Lab report category but structured values not extracted — Gemini should read raw text.");
  }

  if (rejected.length > 0 && inferred.length === 0) {
    reasons.push("Rule keywords were rejected (e.g. template text); clinical AI should interpret the document.");
  }

  if (input.rules.detectedConditions.length > 0 && inferred.length === 0 && broadClinical) {
    reasons.push("Keyword flags do not match value-based rules — possible mismatch.");
  }

  let level: RuleCoverageLevel;
  if (score >= 4 && !broadClinical && reasons.length <= 1) level = "high";
  else if (score >= 2) level = "medium";
  else level = "low";

  if (broadClinical && level === "high") level = "medium";

  const forceGemini = process.env.AI_GEMINI_PRIMARY_VERDICT === "true";
  const preferGeminiVerdict =
    forceGemini ||
    level === "low" ||
    level === "medium" ||
    broadClinical ||
    (isImaging && markers.length === 0) ||
    (textLen > 400 && markers.length === 0);

  if (!reasons.some((r) => r.includes("Gemini") || r.includes("combined"))) {
    reasons.push(
      "Final verdict combines rule-based lab extraction with Gemini clinical read when API is available.",
    );
  }

  return { level, preferGeminiVerdict, reasons };
}
