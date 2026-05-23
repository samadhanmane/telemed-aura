import type { AiAnalysisResult, ScanSummaryMeta } from "../core/types.js";
import { assembleFinalOutput, buildAnalysisDetails } from "../analysis/output-builder.js";
import { buildClinicalReport } from "../analysis/clinical-report-builder.js";
import { buildHybridVerdict } from "../analysis/hybrid-verdict.js";
import { mlRiskAdjustment } from "../ml/risk-scorer.js";
import { analyzeReportWithRules } from "../rules/report-rules.js";
import { computeRuleSeverity } from "../rules/severity-engine.js";
import { detectConditionsFromText } from "../rules/disease-severity.rules.js";
import { collectDocumentRemarks } from "../rules/remark-severity.rules.js";
import type { GeminiVisionFindings } from "../core/types.js";
import { buildRuleBasedGuidance, mergeGuidance } from "../analysis/patient-guidance.js";
import { shouldRunGeminiClinicalAnalysis } from "./cost-guard.js";
import { assessRuleCoverage } from "./rule-coverage.js";
import { runGeminiClinicalVerdict } from "../synthesis/gemini-clinical-verdict.js";
import { isGeminiQuotaBlocked } from "../models/gemini-quota.js";
import { resolveImagingContext } from "../imaging/imaging-context.js";

const CATEGORY_SPECIALIST: Record<string, string> = {
  Cardiology: "cardiology",
  Pathology: "general_physician",
  Radiology: "general_physician",
  Dermatology: "dermatology",
  General: "general_physician",
  "Blood test": "general_physician",
  "X-Ray": "general_physician",
  "CT scan": "general_physician",
  ECG: "cardiology",
};

export async function runDocumentAnalysisPipeline(input: {
  name: string;
  category: string;
  reportText: string;
  extractionMethod: string;
  mimeType: string;
  imageBuffer?: Buffer;
  doctorRemarks?: string;
  scanSummary?: ScanSummaryMeta;
  isImagingStudy?: boolean;
  extractionVision?: GeminiVisionFindings | null;
  geminiPagesUsed?: number;
}): Promise<AiAnalysisResult> {
  const rules = analyzeReportWithRules(input.name, input.category, input.reportText);
  const imaging = resolveImagingContext({
    name: input.name,
    category: input.category,
    mimeType: input.mimeType,
    isImagingStudy: input.isImagingStudy,
    documentType: rules.documentType,
  });
  const { severe } = detectConditionsFromText(input.reportText);

  const coverage = assessRuleCoverage({
    category: input.category,
    reportText: input.reportText,
    rules,
    isImagingStudy: input.isImagingStudy,
  });

  const mlDelta = mlRiskAdjustment({
    extractedVitals: rules.extractedVitals,
    detectedConditions: rules.detectedConditions,
    textLength: input.reportText.length,
    category: input.category,
  });

  const vision = input.extractionVision ?? null;
  const visionUsed = Boolean(
    (input.geminiPagesUsed && input.geminiPagesUsed > 0) ||
      vision?.imagingSummary ||
      (vision?.visibleFindings?.length ?? 0) > 0,
  );
  if (vision?.visibleFindings?.length) {
    rules.abnormalities.push(
      ...vision.visibleFindings.slice(0, 3).map((f) => `Imaging: ${f}`),
    );
  }
  if (visionUsed && vision?.documentType) {
    if (vision.documentType === "xray" || vision.documentType === "ct_scan") {
      rules.documentType = vision.documentType;
    }
  }

  const preRemarks = collectDocumentRemarks({
    reportText: input.reportText,
    vision,
    doctorRemarks: input.doctorRemarks,
  });

  let { severity, riskScore, abnormalities } = computeRuleSeverity({
    category: input.category,
    reportText: input.reportText,
    extractedVitals: rules.extractedVitals,
    severeConditions: severe,
    moderateConditions: rules.detectedConditions,
    visionFindings: vision,
    mlRiskAdjustment: mlDelta,
    remarkTexts: preRemarks,
    isImagingStudy: imaging.isImaging,
    visionUsed,
  });

  rules.abnormalities = [...new Set([...rules.abnormalities, ...abnormalities])];

  let synthesisUsed = false;
  let geminiVerdictPrimary = false;
  let synthesisGuidance: Partial<import("../core/types.js").PatientGuidance> | undefined;
  let geminiResult: Awaited<ReturnType<typeof runGeminiClinicalVerdict>> = null;

  const skipClinicalBecauseVision =
    visionUsed &&
    Boolean(vision?.imagingSummary) &&
    imaging.isImaging &&
    input.mimeType?.startsWith("image/");

  if (
    !skipClinicalBecauseVision &&
    shouldRunGeminiClinicalAnalysis(input.reportText.length, {
      isImagingStudy: imaging.isImaging,
      mimeType: input.mimeType,
      hasVisionFindings: visionUsed,
    })
  ) {
    geminiResult = await runGeminiClinicalVerdict({
      name: input.name,
      category: input.category,
      reportText: input.reportText,
      rules,
      vision,
      severity,
      riskScore,
      coverage,
      imageBuffer: input.imageBuffer,
      mimeType: input.mimeType,
      isImagingStudy: imaging.isImaging,
    });
    if (geminiResult) {
      synthesisUsed = true;
      geminiVerdictPrimary =
        coverage.preferGeminiVerdict ||
        geminiResult.verdictPrimary ||
        geminiResult.ruleAgreement === "overrides" ||
        geminiResult.ruleAgreement === "extends";
      synthesisGuidance = {
        pros: geminiResult.pros,
        cons: geminiResult.cons,
        doList: geminiResult.doList,
        avoidList: geminiResult.avoidList,
      };
    }
  }

  const markers = rules.labMarkers ?? [];
  const inferred = rules.inferredConditions ?? [];
  const keywordRejected = rules.keywordRejected ?? [];
  const ruleSymptoms = rules.symptomsFromReport ?? [];

  const clinical = buildClinicalReport({
    reportName: input.name,
    category: input.category,
    markers,
    inferred,
    keywordRejected,
    symptoms: ruleSymptoms,
    severity,
    riskScore,
    coverageReasons: coverage.reasons,
    geminiBrief: geminiResult?.clinicalBrief,
    geminiDiseases: geminiResult?.possibleDiseases,
    geminiPrimary: geminiVerdictPrimary ? geminiResult : null,
    isImaging: imaging.isImaging,
    visionUsed,
    documentType: rules.documentType,
    visionFindings: vision,
  });

  const quotaLimited = isGeminiQuotaBlocked();
  const hybrid = buildHybridVerdict({
    clinical,
    gemini: geminiResult,
    markers,
    severity,
    riskScore,
    synthesisUsed,
    quotaLimited: quotaLimited && !synthesisUsed,
    isImaging: imaging.isImaging,
    visionUsed,
    visionFindings: vision,
    reportName: input.name,
  });

  const possibleDiseases = hybrid.possibleDiseases;
  const symptomsFromReport = hybrid.symptomsFromReport;
  const finalVerdict = hybrid.finalVerdict;
  const clinicalBrief = hybrid.clinicalBrief;
  const patientProblemSummary = hybrid.patientProblemSummary;
  const summary = hybrid.summary;
  const assessmentBasis = [...new Set([...hybrid.assessmentBasis])];
  let insights = hybrid.insights;

  const guidance = mergeGuidance(
    buildRuleBasedGuidance({
      rules,
      severity,
      riskScore,
      isImaging: imaging.isImaging,
      visionUsed,
    }),
    synthesisGuidance,
  );

  if (quotaLimited && !synthesisUsed) {
    if (imaging.visionRequired) {
      insights.push(
        "This is an imaging study — AI vision/clinical read was not available. A doctor must review the image; automated screening is not a normal/low result.",
      );
    }
  }

  const analysisDetails = buildAnalysisDetails({
    rules,
    vision,
    severity,
    riskScore,
    keyLabFindings: clinical.keyLabFindings,
    possibleDiseases,
    assessmentBasis,
  });

  return assembleFinalOutput({
    patientProblemSummary,
    clinicalBrief,
    finalVerdict,
    assessmentBasis,
    symptomsFromReport,
    possibleDiseases,
    keyLabFindings: clinical.keyLabFindings,
    summary,
    insights,
    analysisDetails,
    riskScore,
    severity,
    suggestedSpecialist: CATEGORY_SPECIALIST[input.category] ?? "general_physician",
    rules,
    vision,
    guidance,
    pipeline: {
      extractionMethod: input.extractionMethod,
      extractedTextLength: input.reportText.length,
      pageCount: input.scanSummary?.totalPages,
      visionUsed,
      synthesisUsed,
      mlUsed: true,
      detectedConditions: rules.detectedConditions,
      documentType: vision?.documentType ?? rules.documentType,
      remarkAdjusted: true,
      scanSummary: input.scanSummary,
      geminiQuotaLimited: quotaLimited && !synthesisUsed,
      ruleConfidence: coverage.level,
      geminiVerdictPrimary:
        (geminiVerdictPrimary && synthesisUsed) || hybrid.verdictSource === "gemini-primary",
      geminiRuleAgreement: geminiResult?.ruleAgreement,
      verdictSource: hybrid.verdictSource,
      visionScanOk: visionUsed,
    },
  });
}
