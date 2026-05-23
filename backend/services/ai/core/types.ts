import type { SpecialtyId } from "../../../src/constants/specialties.js";

export type SeverityLevel = "Low" | "Moderate" | "High" | "Critical";
export type TriagePriority = 1 | 2 | 3 | 4;
export type ChartType = "bar" | "line" | "comparison" | "vitals" | "risk" | "pie" | "area" | "radar";

export type PatientGuidance = {
  pros: string[];
  cons: string[];
  doList: string[];
  avoidList: string[];
};

export type PossibleDisease = {
  name: string;
  likelihood: "low" | "moderate" | "high" | string;
  source: "gemini" | "rules" | "both";
  note?: string;
};

export type KeyLabFinding = {
  test: string;
  value: string;
  status?: "normal" | "high" | "low" | "borderline" | string;
  refRange?: string;
};

export type ChartPoint = {
  label: string;
  value: number;
  ref?: string;
  unit?: string;
};

export type ChartSeries = {
  id: string;
  title: string;
  type: ChartType;
  data: ChartPoint[];
};

export type ExtractedVitals = {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  fastingGlucose?: number;
  randomGlucose?: number;
  hba1c?: number;
  hemoglobin?: number;
  totalCholesterol?: number;
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
  heartRate?: number;
  oxygenSaturation?: number;
};

export type ScanPageDetail = {
  page_num: number;
  status: "success" | "partial" | "failed" | "skipped";
  method: string;
  char_count: number;
  image_count: number;
};

export type ScanSummaryMeta = {
  totalPages: number;
  pagesScanned: number;
  pagesFailed: number;
  pagesRemaining: number[];
  imagesDetected: number;
  imagesOcred: number;
  scanSuccessPercent: number;
  dataRetrievalPercent: number;
  pageDetails: ScanPageDetail[];
  summaryShort: string;
  primaryMethod: string;
};

export type PipelineMeta = {
  extractionMethod: string;
  extractedTextLength: number;
  pageCount?: number;
  visionUsed: boolean;
  synthesisUsed: boolean;
  mlUsed: boolean;
  detectedConditions: string[];
  documentType?: string;
  remarkAdjusted?: boolean;
  scanSummary?: ScanSummaryMeta;
  chunksIndexed?: number;
  /** True when Gemini was skipped due to API quota / rate limit. */
  geminiQuotaLimited?: boolean;
  /** How well rule engine covered this document (high | medium | low). */
  ruleConfidence?: "high" | "medium" | "low";
  /** Gemini drove final verdict because rules were insufficient. */
  geminiVerdictPrimary?: boolean;
  geminiRuleAgreement?: "supports" | "extends" | "overrides";
  verdictSource?: "rules+gemini" | "rules-only" | "gemini-primary";
  /** True when Gemini vision successfully described the uploaded image. */
  visionScanOk?: boolean;
};

export type AiAnalysisResult = {
  /** Short plain-language: what the patient may be facing (max ~2 sentences). */
  patientProblemSummary?: string;
  /** 5–10 line patient-friendly report brief (Gemini when available). */
  clinicalBrief?: string;
  /** One-paragraph conclusion with severity basis. */
  finalVerdict?: string;
  /** Step-by-step why we reached severity / conditions. */
  assessmentBasis?: string[];
  /** Symptoms/complaints found in report wording. */
  symptomsFromReport?: string[];
  /** Possible conditions — Gemini + rule-based merged. */
  possibleDiseases?: PossibleDisease[];
  /** Structured labs extracted from report text. */
  keyLabFindings?: KeyLabFinding[];
  /** Clinician-oriented bullet context from rules + vision. */
  analysisDetails?: string[];
  summary: string;
  riskScore: number;
  severity: SeverityLevel;
  suggestedSpecialist?: string;
  insights: string[];
  chartData: ChartPoint[];
  charts?: ChartSeries[];
  abnormalities?: string[];
  extractedVitals?: ExtractedVitals;
  pipeline?: PipelineMeta;
  geminiNarrative?: string;
  /** What looks OK, concerns, lifestyle actions (rule + Gemini synthesis). */
  guidance?: PatientGuidance;
};

export type SymptomScanResult = {
  risk: number;
  severity: SeverityLevel;
  triagePriority: TriagePriority;
  possibleConditions: string[];
  suggestedSpecialist: string;
  suggestedSpecialtyId: SpecialtyId;
  emergency: boolean;
  preventiveSuggestions: string[];
  requiresDoctor: boolean;
  recommendation: string;
  patientProblemSummary?: string;
  /** Rule + vitals + AI flag bullets shown to user */
  analysisDetails?: string[];
  symptomCategory?: string;
  vitalsUsed?: boolean;
  geminiAnalysisUsed?: boolean;
};

export type PrescriptionOcrResult = {
  text: string;
  confidence: number;
  medicines: { name: string; dosage: string; frequency: string; duration: string }[];
  extractionMethod?: string;
  visionUsed?: boolean;
};

export type VitalsRiskInput = {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  sugarLevel?: number;
  oxygenLevel?: number;
  heartRate?: number;
};

export type GeminiVisionFindings = {
  documentType?: string;
  imagingSummary?: string;
  visibleFindings?: string[];
  suggestedFollowUp?: string[];
  /** Short phrases from vision — scanned by remark-severity rules, not used as model scores */
  clinicalFlags?: string[];
  rawNotes?: string;
};

export type RuleAnalysisPartial = {
  extractedVitals: ExtractedVitals;
  detectedConditions: string[];
  abnormalities: string[];
  chartData: ChartPoint[];
  charts: ChartSeries[];
  insights: string[];
  documentType: string;
  labMarkers?: import("../rules/cbc-lab-parser.js").ParsedLabMarker[];
  inferredConditions?: import("../rules/clinical-inference.js").InferredCondition[];
  keywordRejected?: { label: string; reason: string }[];
  symptomsFromReport?: string[];
};
