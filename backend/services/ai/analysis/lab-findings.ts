import type { ChartPoint, ExtractedVitals, KeyLabFinding } from "../core/types.js";

function statusFromValue(value: number, ref?: string): KeyLabFinding["status"] {
  if (!ref) return undefined;
  const parts = ref.split(/[-–]/).map((s) => parseFloat(s.trim()));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    if (value < parts[0]!) return "low";
    if (value > parts[1]!) return "high";
    return "normal";
  }
  const single = parseFloat(ref);
  if (!Number.isNaN(single)) {
    if (value > single * 1.05) return "high";
    if (value < single * 0.95) return "low";
  }
  return "borderline";
}

/** Build a lab table from parsed vitals + chart markers for the medical report view. */
export function buildKeyLabFindings(
  vitals: ExtractedVitals,
  chartData: ChartPoint[],
): KeyLabFinding[] {
  const rows: KeyLabFinding[] = [];

  const push = (test: string, value: string, refRange?: string, num?: number) => {
    rows.push({
      test,
      value,
      refRange,
      status: num != null && refRange ? statusFromValue(num, refRange) : undefined,
    });
  };

  if (vitals.bloodPressureSystolic != null) {
    push(
      "Blood pressure",
      `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic ?? "—"} mmHg`,
      "90-120/60-80",
    );
  }
  if (vitals.fastingGlucose != null) push("Fasting glucose", `${vitals.fastingGlucose} mg/dL`, "70-100", vitals.fastingGlucose);
  if (vitals.randomGlucose != null) push("Blood glucose", `${vitals.randomGlucose} mg/dL`, "70-140", vitals.randomGlucose);
  if (vitals.hba1c != null) push("HbA1c", `${vitals.hba1c}%`, "4-5.6", vitals.hba1c);
  if (vitals.hemoglobin != null) push("Hemoglobin", `${vitals.hemoglobin} g/dL`, "12-16", vitals.hemoglobin);
  if (vitals.totalCholesterol != null) push("Total cholesterol", `${vitals.totalCholesterol} mg/dL`, "200", vitals.totalCholesterol);
  if (vitals.ldl != null) push("LDL", `${vitals.ldl} mg/dL`, "100", vitals.ldl);
  if (vitals.hdl != null) push("HDL", `${vitals.hdl} mg/dL`, "40", vitals.hdl);
  if (vitals.triglycerides != null) push("Triglycerides", `${vitals.triglycerides} mg/dL`, "150", vitals.triglycerides);

  for (const d of chartData) {
    if (rows.some((r) => r.test === d.label)) continue;
    const unit = d.unit ? ` ${d.unit}` : "";
    push(d.label, `${d.value}${unit}`, d.ref, d.value);
  }

  return rows.slice(0, 16);
}
