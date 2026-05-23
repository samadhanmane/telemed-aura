import type { PossibleDisease } from "../core/types.js";
import type { ParsedLabMarker } from "./cbc-lab-parser.js";

export type InferredCondition = PossibleDisease & {
  evidence: string[];
  basis: "lab_value" | "symptom" | "keyword" | "combined";
};

const TEMPLATE_ONLY =
  /\b(sample\s*report|template|example\s*report|drlogy|for\s*educational|reference\s*interval\s*guide)\b/i;

/** Value-based clinical screening — primary source of truth. */
export function inferConditionsFromLabs(
  markers: ParsedLabMarker[],
  symptoms: string[],
): InferredCondition[] {
  const out: InferredCondition[] = [];
  const hb = markers.find((m) => m.test === "Hemoglobin");
  const wbc = markers.find((m) => m.test === "WBC");
  const plt = markers.find((m) => m.test === "Platelets");
  const mcv = markers.find((m) => m.test === "MCV");
  const glucose = markers.find((m) => m.test === "Fasting glucose" || m.test === "Blood glucose");
  const hba1c = markers.find((m) => m.test === "HbA1c");
  const ldl = markers.find((m) => m.test === "LDL");
  const hdl = markers.find((m) => m.test === "HDL");

  if (hb && (hb.status === "low" || hb.value < 12)) {
    const micro = mcv && mcv.value < 80;
    out.push({
      name: micro ? "Iron-deficiency anemia (screening)" : "Anemia (low hemoglobin)",
      likelihood: hb.value < 8 ? "high" : hb.value < 10 ? "high" : "moderate",
      source: "rules",
      note: micro
        ? "Low Hb with low MCV pattern — iron deficiency is common; confirm with ferritin."
        : "Hemoglobin below reference — needs clinical correlation.",
      evidence: [`Hemoglobin ${hb.value} ${hb.unit} (ref ${hb.refLow}-${hb.refHigh})`],
      basis: "lab_value",
    });
  }

  if (hb && hb.status === "high") {
    out.push({
      name: "Polycythemia / elevated hemoglobin (screening)",
      likelihood: "moderate",
      source: "rules",
      evidence: [`Hemoglobin ${hb.value} ${hb.unit} above reference`],
      basis: "lab_value",
    });
  }

  if (wbc && wbc.status === "high") {
    out.push({
      name: "Leukocytosis (elevated WBC)",
      likelihood: wbc.value > 15 ? "high" : "moderate",
      source: "rules",
      note: "Often infection, inflammation, or stress — not specific without symptoms.",
      evidence: [`WBC ${wbc.value} ${wbc.unit} (ref ${wbc.refLow}-${wbc.refHigh})`],
      basis: "lab_value",
    });
  }
  if (wbc && wbc.status === "low") {
    out.push({
      name: "Leukopenia (low WBC)",
      likelihood: "moderate",
      source: "rules",
      evidence: [`WBC ${wbc.value} ${wbc.unit} below reference`],
      basis: "lab_value",
    });
  }

  if (plt && plt.status === "low") {
    out.push({
      name: "Thrombocytopenia (low platelets)",
      likelihood: plt.value < 100 ? "high" : "moderate",
      source: "rules",
      evidence: [`Platelets ${plt.value} ${plt.unit} (ref ${plt.refLow}-${plt.refHigh})`],
      basis: "lab_value",
    });
  }

  if (glucose && (glucose.status === "high" || glucose.value >= 126)) {
    out.push({
      name: "Hyperglycemia / diabetes screening",
      likelihood: glucose.value >= 200 ? "high" : "moderate",
      source: "rules",
      evidence: [`${glucose.test} ${glucose.value} ${glucose.unit}`],
      basis: "lab_value",
    });
  }
  if (hba1c && hba1c.value >= 6.5) {
    out.push({
      name: "Diabetes mellitus (HbA1c screening)",
      likelihood: hba1c.value >= 8 ? "high" : "moderate",
      source: "rules",
      evidence: [`HbA1c ${hba1c.value}% (ref <${hba1c.refHigh})`],
      basis: "lab_value",
    });
  }

  if (ldl && ldl.status === "high") {
    out.push({
      name: "Hyperlipidemia (elevated LDL)",
      likelihood: ldl.value >= 160 ? "high" : "moderate",
      source: "rules",
      evidence: [`LDL ${ldl.value} ${ldl.unit}`],
      basis: "lab_value",
    });
  }
  if (hdl && hdl.status === "low") {
    out.push({
      name: "Low HDL cholesterol",
      likelihood: "moderate",
      source: "rules",
      evidence: [`HDL ${hdl.value} ${hdl.unit} below reference`],
      basis: "lab_value",
    });
  }

  if (symptoms.some((s) => s.includes("Diabetes"))) {
    const hasSugar = glucose || hba1c;
    if (!hasSugar) {
      out.push({
        name: "Diabetes symptoms without glucose on report",
        likelihood: "low",
        source: "rules",
        note: "Symptoms noted but no glucose value extracted — fasting glucose/HbA1c may be on another page.",
        evidence: symptoms.filter((s) => s.includes("Diabetes")),
        basis: "symptom",
      });
    }
  }

  return out;
}

/** Keyword conditions only if labs do not contradict and not template boilerplate. */
export function filterKeywordConditions(
  text: string,
  keywordLabels: string[],
  markers: ParsedLabMarker[],
): { accepted: string[]; rejected: { label: string; reason: string }[] } {
  const accepted: string[] = [];
  const rejected: { label: string; reason: string }[] = [];
  const isTemplate = TEMPLATE_ONLY.test(text);
  const hb = markers.find((m) => m.test === "Hemoglobin");

  for (const label of keywordLabels) {
    const lower = label.toLowerCase();
    if (lower.includes("anemia")) {
      if (hb && hb.status === "normal" && hb.value >= 12) {
        rejected.push({
          label,
          reason: isTemplate
            ? "Report looks like a sample/template; hemoglobin is in normal range — not counted as your diagnosis."
            : `Hemoglobin ${hb.value} g/dL is within range — keyword "${label}" ignored.`,
        });
        continue;
      }
      if (!hb) {
        rejected.push({
          label,
          reason: "Word appears in document but no hemoglobin value was extracted to confirm.",
        });
        continue;
      }
    }
    if (isTemplate && !markers.some((m) => m.status === "low" || m.status === "high")) {
      rejected.push({
        label,
        reason: "Likely template/educational text without supporting abnormal labs on this read.",
      });
      continue;
    }
    accepted.push(label);
  }
  return { accepted, rejected };
}
