import type { GeminiVisionFindings, PossibleDisease, SeverityLevel } from "../core/types.js";

/** Patient-facing verdict when Gemini vision ran but full clinical JSON did not. */
export function buildVerdictFromVisionFindings(input: {
  vision: GeminiVisionFindings;
  reportName: string;
  severity: SeverityLevel;
  riskScore: number;
}): {
  finalVerdict: string;
  clinicalBrief: string;
  patientProblemSummary: string;
  summary: string;
  assessmentBasis: string[];
  possibleDiseases: PossibleDisease[];
  insights: string[];
} {
  const vf = input.vision;
  const findings = vf.visibleFindings ?? [];
  const flags = vf.clinicalFlags ?? [];

  const assessmentBasis = [
    "Gemini AI vision analyzed the uploaded image (not OCR lab rules).",
    vf.imagingSummary ? `Image summary: ${vf.imagingSummary}` : "",
    ...findings.map((f) => `Visible: ${f}`),
    ...flags.map((f) => `Note: ${f}`),
    `Screening reference index ${input.riskScore}% (${input.severity}) — confirm with your doctor.`,
  ].filter(Boolean);

  const finalVerdict = [
    vf.imagingSummary || "The image was reviewed by AI vision.",
    findings.length ? `Observations: ${findings.join("; ")}.` : "",
    flags.length ? `Points to discuss: ${flags.join("; ")}.` : "",
    "This is an AI screening read only — a radiologist or your doctor must confirm.",
  ]
    .filter(Boolean)
    .join(" ");

  const clinicalBrief = [
    `Report: ${input.reportName}`,
    "",
    "What we see on your image (AI vision):",
    vf.imagingSummary || "(see findings below)",
    "",
    ...findings.map((f) => `• ${f}`),
    ...(flags.length ? ["", "Notes:", ...flags.map((f) => `• ${f}`)] : []),
    ...(vf.suggestedFollowUp?.length
      ? ["", "Suggested follow-up:", ...vf.suggestedFollowUp.map((f) => `• ${f}`)]
      : []),
  ].join("\n");

  const possibleDiseases: PossibleDisease[] = flags.slice(0, 3).map((f) => ({
    name: f,
    likelihood: "moderate",
    source: "gemini" as const,
    note: "From AI image read — needs clinician confirmation",
  }));

  return {
    finalVerdict,
    clinicalBrief: clinicalBrief.slice(0, 1600),
    patientProblemSummary: vf.imagingSummary?.slice(0, 450) || findings[0] || "Image reviewed by AI vision.",
    summary: `${input.reportName}: ${vf.imagingSummary?.slice(0, 200) ?? "AI vision read completed."}`,
    assessmentBasis,
    possibleDiseases,
    insights: findings.slice(0, 4),
  };
}
