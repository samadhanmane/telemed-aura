import type {
  KeyLabFinding,
  PossibleDisease,
  SeverityLevel,
} from "../core/types.js";
import type { ParsedLabMarker } from "../rules/cbc-lab-parser.js";
import type { InferredCondition } from "../rules/clinical-inference.js";
import type { GeminiVisionFindings } from "../core/types.js";

export type ClinicalReportOutput = {
  clinicalBrief: string;
  patientProblemSummary: string;
  summary: string;
  finalVerdict: string;
  assessmentBasis: string[];
  symptomsFromReport: string[];
  possibleDiseases: PossibleDisease[];
  keyLabFindings: KeyLabFinding[];
  insights: string[];
};

function markerToFinding(m: ParsedLabMarker): KeyLabFinding {
  return {
    test: m.test,
    value: `${m.value} ${m.unit}`,
    refRange: `${m.refLow}-${m.refHigh}`,
    status: m.status,
  };
}

function formatDiseaseLine(d: PossibleDisease): string {
  return `${d.name} (${d.likelihood})${d.note ? ` — ${d.note}` : ""}`;
}

export function buildClinicalReport(input: {
  reportName: string;
  category: string;
  markers: ParsedLabMarker[];
  inferred: InferredCondition[];
  keywordRejected: { label: string; reason: string }[];
  symptoms: string[];
  severity: SeverityLevel;
  riskScore: number;
  coverageReasons?: string[];
  geminiBrief?: string;
  geminiDiseases?: PossibleDisease[];
  /** When set, pipeline uses Gemini for final narrative (rules = labs only). */
  geminiPrimary?: {
    finalVerdict: string;
    clinicalBrief: string;
    patientProblemSummary: string;
    summary: string;
  } | null;
  isImaging?: boolean;
  visionUsed?: boolean;
  documentType?: string;
  visionFindings?: GeminiVisionFindings | null;
}): ClinicalReportOutput {
  const keyLabFindings = input.markers.map(markerToFinding);
  const abnormal = input.markers.filter(
    (m) => m.status === "low" || m.status === "high" || m.status === "critical",
  );
  const critical = input.markers.filter((m) => m.status === "critical");
  const normalCount = input.markers.filter((m) => m.status === "normal").length;

  const assessmentBasis: string[] = [...(input.coverageReasons ?? [])];

  if (input.markers.length > 0) {
    assessmentBasis.push(
      `Parsed ${input.markers.length} lab marker(s) from document text (OCR/pdf-parse).`,
    );
    for (const m of abnormal.slice(0, 6)) {
      assessmentBasis.push(
        `${m.test} = ${m.value} ${m.unit} is ${m.status.toUpperCase()} vs reference ${m.refLow}-${m.refHigh}.`,
      );
    }
    if (normalCount > 0 && abnormal.length === 0) {
      assessmentBasis.push(
        `All extracted numeric values (${normalCount} tests) fall within reference ranges on this automated read.`,
      );
    }
  } else if (input.isImaging) {
    assessmentBasis.push(
      input.visionUsed
        ? "Imaging study — Gemini vision described findings from the image; lab rules do not apply."
        : "Imaging study — OCR cannot grade X-ray/CT photos; AI vision or a radiologist is required for a real verdict.",
    );
  } else {
    assessmentBasis.push(
      "No structured lab numbers could be extracted — severity uses text keywords only (lower confidence).",
    );
  }

  for (const inf of input.inferred.slice(0, 5)) {
    assessmentBasis.push(
      `Screening: ${inf.name} — based on ${inf.basis}: ${inf.evidence?.join("; ") ?? inf.note ?? "lab pattern"}.`,
    );
  }

  for (const r of input.keywordRejected) {
    assessmentBasis.push(`Not counted: "${r.label}" — ${r.reason}`);
  }

  if (input.symptoms.length) {
    assessmentBasis.push(`Symptoms/complaints mentioned in report: ${input.symptoms.join(", ")}.`);
  }

  assessmentBasis.push(
    `Risk index ${input.riskScore}% and level "${input.severity}" come from rule engine (vitals + abnormal labs + flags), not from Gemini scores.`,
  );

  const possibleDiseases: PossibleDisease[] = [
    ...input.inferred.map(({ evidence: _e, basis: _b, ...d }) => d),
    ...(input.geminiDiseases ?? []),
  ];

  const diseaseNames = [...new Set(possibleDiseases.map((d) => d.name))];

  let finalVerdict: string;
  const severityFromTextOnly =
    abnormal.length === 0 &&
    input.inferred.length === 0 &&
    (input.severity === "Critical" || input.severity === "High");

  const vf = input.visionFindings;
  if (input.visionUsed && vf?.imagingSummary) {
    const obs = (vf.visibleFindings ?? []).join("; ");
    finalVerdict = [
      vf.imagingSummary,
      obs ? `Observations: ${obs}.` : "",
      "AI vision screening only — your doctor or radiologist must confirm.",
    ]
      .filter(Boolean)
      .join(" ");
  } else if (input.isImaging && !input.visionUsed && input.markers.length === 0) {
    finalVerdict = `We could not scan this image with Gemini AI (often due to API rate limits). Re-upload in a few minutes, or ask a doctor to review the film directly. Until then, treat this as needing expert review — not a confirmed normal result.`;
  } else if (critical.length > 0) {
    finalVerdict = `CRITICAL lab values on report: ${critical.map((m) => `${m.test} ${m.value} ${m.unit}`).join(", ")}. Urgent clinician review. Screening ${input.severity} (${input.riskScore}%).`;
  } else if (abnormal.length === 0 && input.inferred.length === 0) {
    finalVerdict = severityFromTextOnly
      ? `Automated screening is ${input.severity} (${input.riskScore}%) from report flags/comments even though structured lab parsing was incomplete. Share the PDF with your doctor and repeat labs if advised.`
      : diseaseNames.length === 0
        ? input.isImaging
          ? `Imaging study on file. Screening reference: ${input.severity} (${input.riskScore}%) until a clinician reviews the image.`
          : `On automated review, no abnormal lab values were extracted and no condition is supported by numbers in this file. Screening level: ${input.severity}. Share the original PDF with your doctor.`
        : `Screening level ${input.severity} (${input.riskScore}% index) — possible topics for discussion: ${diseaseNames.slice(0, 3).join(", ")}. Confirm with your clinician.`;
  } else {
    finalVerdict = `Screening level ${input.severity} (${input.riskScore}% index). Main findings: ${abnormal.map((m) => `${m.test} ${m.status}`).join(", ") || "see conditions below"}. ${diseaseNames.length ? `Consider discussing: ${diseaseNames.slice(0, 4).join(", ")}.` : ""} This is not a final diagnosis.`;
  }

  const briefLines: string[] = [
    `Report: ${input.reportName} (${input.category})`,
    "",
  ];

  if (input.markers.length > 0) {
    briefLines.push("Extracted results from your document:");
    for (const m of input.markers.slice(0, 10)) {
      const flag =
        m.status === "critical"
          ? "CRITICAL"
          : m.status === "normal"
            ? "within range"
            : m.status === "high"
              ? "HIGH"
              : m.status === "low"
                ? "LOW"
                : "borderline";
      briefLines.push(`• ${m.test}: ${m.value} ${m.unit} (${flag}; ref ${m.refLow}-${m.refHigh})`);
    }
    briefLines.push("");
  } else if (input.visionUsed && vf) {
    briefLines.push("What we see on your image (Gemini AI vision):", "");
    if (vf.imagingSummary) briefLines.push(vf.imagingSummary, "");
    for (const f of vf.visibleFindings ?? []) briefLines.push(`• ${f}`);
    for (const f of vf.clinicalFlags ?? []) briefLines.push(`• Note: ${f}`);
    briefLines.push("");
  } else if (input.isImaging) {
    briefLines.push(
      "Gemini could not scan this image (check API key/quota in backend, then re-upload).",
      "A doctor should review the picture directly.",
      "",
    );
  } else {
    briefLines.push(
      "We could not read numeric lab values clearly from this file. Upload a sharper PDF or enter values manually at your clinic.",
      "",
    );
  }

  if (input.symptoms.length) {
    briefLines.push(`Symptoms noted in the report text: ${input.symptoms.join(", ")}.`, "");
  }

  if (input.inferred.length) {
    briefLines.push("What the automated screening suggests:");
    for (const d of input.inferred.slice(0, 4)) {
      briefLines.push(`• ${formatDiseaseLine(d)}`);
      if (d.evidence?.length) briefLines.push(`  Evidence: ${d.evidence.join("; ")}`);
    }
    briefLines.push("");
  }

  if (input.keywordRejected.length) {
    briefLines.push("Not used for conclusions:");
    for (const r of input.keywordRejected.slice(0, 3)) {
      briefLines.push(`• ${r.reason}`);
    }
    briefLines.push("");
  }

  if (input.visionUsed && vf?.imagingSummary) {
    briefLines.push("Share these findings with your doctor for confirmation.");
  } else if (!input.isImaging || !input.visionUsed) {
    briefLines.push(finalVerdict);
  }

  const patientProblemSummary =
    input.inferred.length > 0
      ? input.inferred
          .slice(0, 2)
          .map((d) => d.name)
          .join("; ") +
        (abnormal.length ? ` — key labs: ${abnormal.map((m) => m.test).join(", ")}.` : ".")
      : abnormal.length > 0
        ? `Abnormal values on your report: ${abnormal.map((m) => `${m.test} (${m.status})`).join(", ")}.`
        : input.visionUsed && vf?.imagingSummary
          ? vf.imagingSummary.slice(0, 200)
          : input.isImaging
            ? `Medical image — AI vision read pending or failed (${input.severity} reference).`
            : `No abnormal labs detected automatically; ${input.severity} screening level from document review.`;

  const summary = `${input.reportName}: ${input.severity} significance (${input.riskScore}% screening index). ${patientProblemSummary}`;

  const insights: string[] = [];
  if (abnormal.length) {
    insights.push(
      `${abnormal.length} marker(s) outside reference: ${abnormal.map((m) => m.test).join(", ")}.`,
    );
  }
  for (const d of input.inferred.slice(0, 3)) {
    insights.push(`${d.name}: ${d.evidence?.[0] ?? d.note ?? "see lab table"}`);
  }
  if (input.keywordRejected.length) {
    insights.push(
      `Ignored template keywords: ${input.keywordRejected.map((r) => r.label).join(", ")}.`,
    );
  }

  const clinicalBrief = input.geminiPrimary?.clinicalBrief?.trim()
    ? input.geminiPrimary.clinicalBrief.trim()
    : input.geminiBrief?.trim()
      ? `${input.geminiBrief.trim()}\n\n---\nRule-based lab checks: ${finalVerdict}`
      : briefLines.join("\n").slice(0, 1400);

  if (input.geminiPrimary) {
    return {
      clinicalBrief,
      patientProblemSummary:
        input.geminiPrimary.patientProblemSummary || patientProblemSummary,
      summary: input.geminiPrimary.summary || summary,
      finalVerdict: input.geminiPrimary.finalVerdict || finalVerdict,
      assessmentBasis,
      symptomsFromReport: input.symptoms,
      possibleDiseases: [
        ...input.inferred.map(({ evidence: _e, basis: _b, ...d }) => d),
        ...(input.geminiDiseases ?? []),
      ],
      keyLabFindings,
      insights,
    };
  }

  return {
    clinicalBrief,
    patientProblemSummary,
    summary,
    finalVerdict,
    assessmentBasis,
    symptomsFromReport: input.symptoms,
    possibleDiseases,
    keyLabFindings,
    insights,
  };
}
