import type { ExtractedVitals } from "../core/types.js";
import { getAiConfig } from "../config/ai.config.js";

/** Trim whitespace and cap length to reduce input tokens. */
export function truncateForPrompt(text: string, maxChars?: number): string {
  const max = maxChars ?? getAiConfig().maxOcrChars;
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max)}…`;
}

/** One-line vitals string (~30 tokens vs full JSON). */
export function compactVitals(v: ExtractedVitals): string {
  const parts: string[] = [];
  if (v.bloodPressureSystolic != null) {
    parts.push(`BP ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic ?? "?"}`);
  }
  if (v.fastingGlucose != null) parts.push(`FBS ${v.fastingGlucose}`);
  if (v.randomGlucose != null) parts.push(`Glucose ${v.randomGlucose}`);
  if (v.hba1c != null) parts.push(`HbA1c ${v.hba1c}%`);
  if (v.hemoglobin != null) parts.push(`Hb ${v.hemoglobin}`);
  if (v.ldl != null) parts.push(`LDL ${v.ldl}`);
  if (v.hdl != null) parts.push(`HDL ${v.hdl}`);
  if (v.triglycerides != null) parts.push(`TG ${v.triglycerides}`);
  if (v.oxygenSaturation != null) parts.push(`SpO2 ${v.oxygenSaturation}%`);
  return parts.length ? parts.join("; ") : "none parsed";
}

export function compactList(items: string[], max = 5): string {
  return items.slice(0, max).join("; ") || "none";
}
