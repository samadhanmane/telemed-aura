/** Severe conditions — if detected in document text → elevate rule-based severity. */
export const SEVERE_DISEASE_PATTERNS: { pattern: RegExp; label: string; minSeverity: "High" | "Critical" }[] = [
  { pattern: /\b(myocardial infarction|heart attack|stemi|nstemi)\b/i, label: "Acute coronary syndrome", minSeverity: "Critical" },
  { pattern: /\b(stroke|cerebrovascular|intracranial hemorrhage)\b/i, label: "Stroke", minSeverity: "Critical" },
  { pattern: /\b(malignant|metastatic|carcinoma|lymphoma)\b/i, label: "Malignancy concern", minSeverity: "Critical" },
  { pattern: /\b(severe pneumonia|lung collapse|pneumothorax)\b/i, label: "Serious respiratory disease", minSeverity: "High" },
  { pattern: /\b(kidney failure|renal failure|dialysis)\b/i, label: "Renal failure", minSeverity: "High" },
  { pattern: /\b(diabetic ketoacidosis|dka)\b/i, label: "DKA", minSeverity: "Critical" },
  { pattern: /\b(sepsis|septic)\b/i, label: "Sepsis", minSeverity: "Critical" },
  { pattern: /\b(active tuberculosis|pulmonary tb)\b/i, label: "Active TB", minSeverity: "High" },
  { pattern: /\b(cirrhosis|liver failure)\b/i, label: "Liver disease", minSeverity: "High" },
  { pattern: /\b(uncontrolled diabetes|uncontrolled hypertension)\b/i, label: "Uncontrolled chronic disease", minSeverity: "High" },
];

export const MODERATE_CONDITION_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(diabetes|type 2 diabetes|type 1 diabetes)\b/i, label: "Diabetes" },
  { pattern: /\b(hypertension|high blood pressure)\b/i, label: "Hypertension" },
  { pattern: /\b(anemia|iron deficiency)\b/i, label: "Anemia" },
  { pattern: /\b(hypothyroid|hyperthyroid|thyroid)\b/i, label: "Thyroid disorder" },
  { pattern: /\b(asthma|copd)\b/i, label: "Chronic respiratory condition" },
  { pattern: /\b(fracture|broken bone|bone fracture)\b/i, label: "Fracture (report text)" },
  { pattern: /\b(osteoarthritis|rheumatoid arthritis|arthritis)\b/i, label: "Arthritis (report text)" },
  { pattern: /\b(herniated disc|disc prolapse|sciatica|spinal stenosis)\b/i, label: "Spinal disorder (report text)" },
  { pattern: /\b(meniscus|acl tear|ligament tear|sprain)\b/i, label: "Musculoskeletal injury (report text)" },
  { pattern: /\b(pneumonia|consolidation|pleural effusion)\b/i, label: "Chest/lung finding (report text)" },
  { pattern: /\b(kidney stone|renal calculi|uti|urinary tract infection)\b/i, label: "Renal/urinary (report text)" },
];

/** Severe / urgent terms in narrative (Gemini still primary for imaging). */
export const URGENT_NARRATIVE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(malignant|metastas|carcinoma|lymphoma|suspicious mass|oncology)\b/i, label: "Malignancy concern (report text)" },
  { pattern: /\b(cord compression|cauda equina)\b/i, label: "Spinal emergency concern (report text)" },
];

export function detectConditionsFromText(text: string): {
  severe: string[];
  moderate: string[];
} {
  const severe: string[] = [];
  const moderate: string[] = [];
  for (const r of SEVERE_DISEASE_PATTERNS) {
    if (r.pattern.test(text)) severe.push(r.label);
  }
  for (const r of MODERATE_CONDITION_PATTERNS) {
    if (r.pattern.test(text)) moderate.push(r.label);
  }
  for (const r of URGENT_NARRATIVE_PATTERNS) {
    if (r.pattern.test(text)) moderate.push(r.label);
  }
  return { severe, moderate };
}
