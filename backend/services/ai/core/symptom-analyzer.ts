import type { SpecialtyId } from "../../../src/constants/specialties.js";
import { getSpecialtyLabel } from "../../../src/constants/specialties.js";
import { detectEmergency, getEmergencyRecommendation } from "./emergency.js";
import { severityToPriority } from "./triage.js";
import type { SeverityLevel, SymptomScanResult } from "./types.js";
import { stableRiskForSeverity, triageSymptomText } from "../rules/symptom-triage.rules.js";

const SPECIALTY_HINTS: { match: string[]; specialist: SpecialtyId; conditions: string[] }[] = [
  {
    match: ["chest", "heart", "palpitation"],
    specialist: "cardiology",
    conditions: ["Cardiovascular symptoms — clinical evaluation needed"],
  },
  {
    match: ["breath", "cough", "wheeze", "throat", "fever"],
    specialist: "general_physician",
    conditions: ["Respiratory or viral illness — common and often mild"],
  },
  {
    match: ["head", "headache", "dizzy", "numb", "tingling", "seizure"],
    specialist: "neurology",
    conditions: ["Neurological symptoms — evaluation if persistent or severe"],
  },
  {
    match: ["rash", "itch", "skin"],
    specialist: "dermatology",
    conditions: ["Skin symptoms — often allergic or irritant"],
  },
  {
    match: ["joint", "back", "muscle", "limb"],
    specialist: "orthopedics",
    conditions: ["Musculoskeletal discomfort"],
  },
  {
    match: ["stomach", "nausea", "vomit", "diarrhea", "abdomen", "abdominal"],
    specialist: "general_physician",
    conditions: ["Gastrointestinal symptoms"],
  },
  {
    match: ["anxiety", "stress", "sleep", "depressed"],
    specialist: "psychology",
    conditions: ["Stress-related symptoms"],
  },
  {
    match: ["child", "baby", "pediatric"],
    specialist: "pediatrics",
    conditions: ["Pediatric symptoms"],
  },
  {
    match: ["pregnant", "pregnancy"],
    specialist: "gynecology",
    conditions: ["Pregnancy-related symptoms"],
  },
];

function pickSpecialist(text: string): { specialist: SpecialtyId; conditions: string[] } {
  let best = SPECIALTY_HINTS[1];
  let maxScore = 0;
  for (const rule of SPECIALTY_HINTS) {
    const score = rule.match.filter((m) => text.includes(m)).length;
    if (score > maxScore) {
      maxScore = score;
      best = rule;
    }
  }
  return { specialist: best.specialist, conditions: best.conditions };
}

export function analyzeSymptoms(input: {
  symptoms: string[];
  description?: string;
  bodyArea?: string;
  age?: number;
  chronicDiseases?: string[];
}): SymptomScanResult {
  const text = [...input.symptoms, input.description ?? "", input.bodyArea ?? ""]
    .join(" ")
    .toLowerCase();

  const emergency = detectEmergency(text);
  const triage = triageSymptomText({
    symptoms: input.symptoms,
    description: input.description,
    bodyArea: input.bodyArea,
  });

  let severity: SeverityLevel = emergency ? "Critical" : triage.severity;
  let risk = emergency ? stableRiskForSeverity("Critical", true) : triage.riskScore;

  if (emergency) {
    severity = "Critical";
    risk = Math.max(risk, 92);
  }

  if (input.age != null && input.age >= 65 && severity === "Moderate") {
    risk = Math.min(75, risk + 6);
  }
  if (input.chronicDiseases?.length && severity !== "Low") {
    risk = Math.min(85, risk + 4);
  }

  const { specialist, conditions } = pickSpecialist(text);
  const triagePriority = severityToPriority(severity, emergency);
  const requiresDoctor =
    emergency || severity === "Critical" || severity === "High" || risk >= 58;

  const possibleConditions = emergency
    ? ["Possible medical emergency — seek urgent in-person or video care immediately"]
    : conditions;

  const recommendation = emergency
    ? getEmergencyRecommendation()
    : requiresDoctor
      ? `Book ${getSpecialtyLabel(specialist)} within 24–48 hours for evaluation`
      : severity === "Moderate"
        ? "Rest, fluids, and monitor. Book a consult if symptoms worsen or last more than 3 days."
        : "Home care is reasonable for mild symptoms. See a doctor if anything new or worsening appears.";

  return {
    risk,
    severity,
    triagePriority,
    possibleConditions,
    suggestedSpecialist: getSpecialtyLabel(specialist),
    suggestedSpecialtyId: specialist,
    emergency,
    preventiveSuggestions: buildPreventiveTips(risk, text, severity),
    requiresDoctor,
    recommendation,
  };
}

function buildPreventiveTips(risk: number, context: string, severity: SeverityLevel) {
  const tips = [
    "Stay hydrated — aim for regular water intake today.",
    "Get adequate rest and avoid strenuous activity if you feel unwell.",
  ];
  if (risk >= 58 || context.includes("chest") || severity === "High") {
    tips.push("Avoid strenuous activity until reviewed by a clinician.");
  }
  if (severity === "Low") {
    tips.push("Use paracetamol only as directed on the package if you have fever or pain.");
  }
  if (severity === "Moderate") tips.push("Track temperature twice daily until symptoms improve.");
  return tips.slice(0, 4);
}
