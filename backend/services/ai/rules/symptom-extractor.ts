/** Extract symptom / complaint phrases documented on the report (not diagnoses). */
const SYMPTOM_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(fatigue|tiredness|weakness|lethargy)\b/i, label: "Fatigue or weakness" },
  { pattern: /\b(fever|pyrexia|febrile)\b/i, label: "Fever" },
  { pattern: /\b(cough|shortness of breath|dyspnea|breathlessness)\b/i, label: "Respiratory symptoms" },
  { pattern: /\b(chest pain|palpitation)\b/i, label: "Chest discomfort" },
  { pattern: /\b(headache|dizziness|vertigo)\b/i, label: "Headache or dizziness" },
  { pattern: /\b(nausea|vomiting|abdominal pain)\b/i, label: "Gastrointestinal symptoms" },
  { pattern: /\b(weight loss|loss of appetite|anorexia)\b/i, label: "Weight loss or poor appetite" },
  { pattern: /\b(polyuria|polydipsia|frequent urination|excessive thirst)\b/i, label: "Diabetes-type symptoms" },
  { pattern: /\b(pallor|pale|jaundice|yellowing)\b/i, label: "Pallor or jaundice noted" },
  { pattern: /\b(bleeding|bruising|petechiae)\b/i, label: "Bleeding or bruising" },
  { pattern: /\b(swelling|edema)\b/i, label: "Swelling" },
  { pattern: /\b(joint pain|arthralgia)\b/i, label: "Joint pain" },
];

const TEMPLATE_NOISE =
  /\b(sample|template|example|drlogy|format|reference\s*range|normal\s*value|educational|demo)\b/i;

export function extractSymptomsFromReportText(text: string): string[] {
  if (TEMPLATE_NOISE.test(text.slice(0, 500))) {
    /* still extract if symptoms appear in clinical sections */
  }
  const found = new Set<string>();
  for (const { pattern, label } of SYMPTOM_PATTERNS) {
    if (pattern.test(text)) found.add(label);
  }
  return [...found].slice(0, 8);
}
