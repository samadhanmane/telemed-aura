import type { ChartPoint, ChartSeries, ExtractedVitals } from "../core/types.js";
import { normalizeMedicalReportText } from "../extraction/text-normalize.js";

export type ParsedLabMarker = {
  test: string;
  value: number;
  unit: string;
  refLow?: number;
  refHigh?: number;
  status: "low" | "high" | "normal" | "borderline" | "critical";
  flag?: string;
};

type RowDef = {
  test: string;
  /** Match test name anywhere before value on same line/chunk */
  nameRe: RegExp;
  unit: string;
  defaultRefLow: number;
  defaultRefHigh: number;
  vitalKey?: keyof ExtractedVitals;
  /** Values in K/mcL for WBC/platelets are already ×10⁹/L scale */
  valueScale?: (v: number) => number;
};

const CBC_ROWS: RowDef[] = [
  {
    test: "WBC",
    nameRe: /(?:white\s*blood\s*cell|wbc)\b/i,
    unit: "K/µL",
    defaultRefLow: 4.8,
    defaultRefHigh: 10.8,
  },
  {
    test: "RBC",
    nameRe: /(?:red\s*blood\s*cell|rbc)\b/i,
    unit: "M/µL",
    defaultRefLow: 4.7,
    defaultRefHigh: 6.1,
  },
  {
    test: "Hemoglobin",
    nameRe: /(?:hemoglobin|haemoglobin|hb\/hgb|hgb\)|\bhgb\b)/i,
    unit: "g/dL",
    defaultRefLow: 14,
    defaultRefHigh: 18,
    vitalKey: "hemoglobin",
  },
  {
    test: "Hematocrit",
    nameRe: /\bhematocrit\b|\bhct\b/i,
    unit: "%",
    defaultRefLow: 42,
    defaultRefHigh: 52,
  },
  {
    test: "MCV",
    nameRe: /\bmcv\b|mean\s*cell\s*volume/i,
    unit: "fL",
    defaultRefLow: 80,
    defaultRefHigh: 100,
  },
  {
    test: "MCH",
    nameRe: /\bmch\b(?!c)|mean\s*cell\s*hemoglobin(?! conc)/i,
    unit: "pg",
    defaultRefLow: 27,
    defaultRefHigh: 32,
  },
  {
    test: "MCHC",
    nameRe: /\bmchc\b|mean\s*cell\s*hb\s*conc/i,
    unit: "g/dL",
    defaultRefLow: 32,
    defaultRefHigh: 36,
  },
  {
    test: "RDW",
    nameRe: /\brdw\b|red\s*cell\s*dist(?:ribution)?\s*width/i,
    unit: "%",
    defaultRefLow: 11.5,
    defaultRefHigh: 14.5,
  },
  {
    test: "Platelets",
    nameRe: /platelet\s*count|\bplatelets?\b/i,
    unit: "K/µL",
    defaultRefLow: 150,
    defaultRefHigh: 450,
  },
  {
    test: "MPV",
    nameRe: /mean\s*platelet\s*volume|\bmpv\b/i,
    unit: "fL",
    defaultRefLow: 7.5,
    defaultRefHigh: 11,
  },
  {
    test: "Neutrophils %",
    nameRe: /neutrophil\s*\(?\s*neut\s*\)?(?!\s*,?\s*absolute)/i,
    unit: "%",
    defaultRefLow: 33,
    defaultRefHigh: 73,
  },
  {
    test: "Lymphocytes %",
    nameRe: /lymphocyte\s*\(?\s*lymph\s*\)?(?!\s*,?\s*absolute)/i,
    unit: "%",
    defaultRefLow: 13,
    defaultRefHigh: 52,
  },
  {
    test: "Neutrophils (abs)",
    nameRe: /neutrophil\s*,?\s*absolute|neutrophil\s*\(?\s*neut\s*\)?\s*,?\s*absolute/i,
    unit: "K/µL",
    defaultRefLow: 1.8,
    defaultRefHigh: 7.8,
  },
  {
    test: "Lymphocytes (abs)",
    nameRe: /lymphocyte\s*,?\s*absolute/i,
    unit: "K/µL",
    defaultRefLow: 1.0,
    defaultRefHigh: 4.8,
  },
  {
    test: "Fasting glucose",
    nameRe: /fasting\s*glucose|fbs|fbg/i,
    unit: "mg/dL",
    defaultRefLow: 70,
    defaultRefHigh: 100,
    vitalKey: "fastingGlucose",
  },
  {
    test: "Blood glucose",
    nameRe: /(?:random|ppbs|blood\s*sugar|glucose)(?!.*a1c)/i,
    unit: "mg/dL",
    defaultRefLow: 70,
    defaultRefHigh: 140,
    vitalKey: "randomGlucose",
  },
  {
    test: "HbA1c",
    nameRe: /hba1c|hb\s*a1c|\ba1c\b/i,
    unit: "%",
    defaultRefLow: 4,
    defaultRefHigh: 5.7,
    vitalKey: "hba1c",
  },
  {
    test: "LDL",
    nameRe: /\bldl\b/i,
    unit: "mg/dL",
    defaultRefLow: 0,
    defaultRefHigh: 100,
    vitalKey: "ldl",
  },
  {
    test: "HDL",
    nameRe: /\bhdl\b/i,
    unit: "mg/dL",
    defaultRefLow: 40,
    defaultRefHigh: 200,
    vitalKey: "hdl",
  },
  {
    test: "Triglycerides",
    nameRe: /triglyceride|\btg\b/i,
    unit: "mg/dL",
    defaultRefLow: 0,
    defaultRefHigh: 150,
    vitalKey: "triglycerides",
  },
];

const VALUE_REF_RE =
  /(\d+\.?\d*)\s*((?:L\*\*|H\*\*|\*\*|L%?|H%?|H\s*fL|HfL|\bL\b|\bH\b)\s*)?(?:g\/dL|gm\/dL|K\/mcL|M\/mcL|fL|pg|%|mg\/dL)?\s*(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/i;

const VALUE_ONLY_RE =
  /(\d+\.?\d*)\s*((?:L\*\*|H\*\*|\*\*|L%?|H%?|H\s*fL|HfL|\bL\b|\bH\b)\s*)?(?:g\/dL|gm\/dL|K\/mcL|M\/mcL|fL|pg|%|mg\/dL)?/i;

function parseRefRange(low: number, high: number): { refLow: number; refHigh: number } {
  return { refLow: Math.min(low, high), refHigh: Math.max(low, high) };
}

function flagToStatus(
  flag: string | undefined,
  value: number,
  refLow: number,
  refHigh: number,
): ParsedLabMarker["status"] {
  const f = (flag ?? "").toUpperCase();
  if (f.includes("**") || f.includes("CRIT")) return "critical";
  if (f.includes("L")) return value < refLow * 0.7 ? "critical" : "low";
  if (f.includes("H")) return "high";
  if (value < refLow * 0.85) return "low";
  if (value < refLow) return "borderline";
  if (value > refHigh * 1.15) return "high";
  if (value > refHigh) return "borderline";
  return "normal";
}

function extractFromChunk(chunk: string, def: RowDef): ParsedLabMarker | null {
  if (!def.nameRe.test(chunk)) return null;

  const afterName = chunk.replace(def.nameRe, " ").trim();
  let m = VALUE_REF_RE.exec(afterName) ?? VALUE_REF_RE.exec(chunk);
  let refLow = def.defaultRefLow;
  let refHigh = def.defaultRefHigh;
  if (!m?.[1]) {
    const vo = VALUE_ONLY_RE.exec(afterName) ?? VALUE_ONLY_RE.exec(chunk);
    if (!vo?.[1]) return null;
    m = vo;
  } else {
    refLow = m[3] ? parseFloat(m[3]) : def.defaultRefLow;
    refHigh = m[4] ? parseFloat(m[4]) : def.defaultRefHigh;
  }

  let value = parseFloat(m[1]!.replace(",", "."));
  if (!Number.isFinite(value)) return null;
  if (def.valueScale) value = def.valueScale(value);

  const flag = m[2]?.trim();
  const { refLow: rl, refHigh: rh } = parseRefRange(refLow, refHigh);

  return {
    test: def.test,
    value,
    unit: def.unit,
    refLow: rl,
    refHigh: rh,
    status: flagToStatus(flag, value, rl, rh),
    flag: flag?.replace(/\s/g, "") || undefined,
  };
}

/** Line-by-line + sliding window for wrapped OCR table rows. */
function parseCbcTableRows(text: string): ParsedLabMarker[] {
  const normalized = normalizeMedicalReportText(text);
  const found = new Map<string, ParsedLabMarker>();

  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    for (const def of CBC_ROWS) {
      if (found.has(def.test)) continue;
      if (!def.nameRe.test(line)) continue;
      const row = extractFromChunk(line, def);
      if (row) found.set(def.test, row);
    }
  }

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i]!;
    const next = lines[i + 1]!;
    for (const def of CBC_ROWS) {
      if (found.has(def.test)) continue;
      if (!def.nameRe.test(line)) continue;
      if (VALUE_REF_RE.test(line) || VALUE_ONLY_RE.test(line)) continue;
      const row = extractFromChunk(`${line} ${next}`, def);
      if (row) found.set(def.test, row);
    }
  }

  if (found.size < 4) {
    for (const def of CBC_ROWS) {
      if (found.has(def.test)) continue;
      const idx = normalized.search(def.nameRe);
      if (idx < 0) continue;
      const slice = normalized.slice(idx, idx + 120);
      const row = extractFromChunk(slice, def);
      if (row) found.set(def.test, row);
    }
  }

  return [...found.values()];
}

export function detectCriticalLabComment(text: string): string[] {
  const notes: string[] = [];
  if (/\*\*|critical\s*value|critically\s*low/i.test(text)) {
    const hgb = text.match(/h(?:emoglobin|gb)[^0-9]{0,40}?(\d+\.?\d*)/i);
    if (hgb && parseFloat(hgb[1]!) < 8) {
      notes.push(`Critical hemoglobin ${hgb[1]} g/dL noted in report comments.`);
    }
    const hct = text.match(/h(?:ematocrit|ct)[^0-9]{0,30}?(\d+\.?\d*)/i);
    if (hct && parseFloat(hct[1]!) < 25) {
      notes.push(`Critical hematocrit ${hct[1]}% noted in report.`);
    }
  }
  return notes;
}

/** Parse CBC and common metabolic labs from report text. */
export function parseLabMarkersFromText(text: string): ParsedLabMarker[] {
  const tableRows = parseCbcTableRows(text);
  if (tableRows.length >= 2) return tableRows;

  const normalized = normalizeMedicalReportText(text);
  const found = new Map<string, ParsedLabMarker>();
  for (const row of tableRows) found.set(row.test, row);

  for (const def of CBC_ROWS) {
    if (found.has(def.test)) continue;
    const idx = normalized.search(def.nameRe);
    if (idx < 0) continue;
    const row = extractFromChunk(normalized.slice(idx, idx + 100), def);
    if (row) found.set(def.test, row);
  }

  return [...found.values()];
}

export function markersToVitals(markers: ParsedLabMarker[]): ExtractedVitals {
  const vitals: ExtractedVitals = {};
  for (const def of CBC_ROWS) {
    if (!def.vitalKey) continue;
    const m = markers.find((x) => x.test === def.test);
    if (m) (vitals as Record<string, number>)[def.vitalKey] = m.value;
  }
  return vitals;
}

export function markersToChartData(markers: ParsedLabMarker[]): {
  chartData: ChartPoint[];
  charts: ChartSeries[];
} {
  const chartData: ChartPoint[] = markers
    .filter(
      (m) =>
        m.status !== "normal" ||
        ["Hemoglobin", "WBC", "RBC", "Hematocrit", "Platelets"].includes(m.test),
    )
    .map((m) => ({
      label: m.test,
      value: m.value,
      ref: `${m.refLow}-${m.refHigh}`,
      unit: m.unit,
    }));

  const charts: ChartSeries[] = [];
  const abnormal = markers.filter(
    (m) => m.status === "low" || m.status === "high" || m.status === "critical",
  );

  if (chartData.length >= 2) {
    charts.push({
      id: "labs-comparison",
      title: "Your values vs reference range",
      type: "comparison",
      data: chartData.slice(0, 10),
    });
  }
  if (abnormal.length >= 1) {
    charts.push({
      id: "abnormal-labs-bar",
      title: "Out-of-range markers",
      type: "bar",
      data: abnormal.map((m) => ({
        label: m.test,
        value: m.value,
        unit: m.unit,
      })),
    });
  }
  return { chartData, charts };
}
