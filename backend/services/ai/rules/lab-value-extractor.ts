import type { ChartPoint, ChartSeries, ExtractedVitals } from "../core/types.js";
import {
  markersToChartData,
  markersToVitals,
  parseLabMarkersFromText,
  type ParsedLabMarker,
} from "./cbc-lab-parser.js";

function parseNum(match: RegExpMatchArray | null, group = 1): number | undefined {
  if (!match) return undefined;
  const n = parseFloat(match[group]!.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

/** Blood pressure from text (not always in CBC table). */
function parseBloodPressure(t: string, vitals: ExtractedVitals): void {
  const bp = t.match(/(?:bp|blood\s*pressure)[:\s]*(\d{2,3})\s*[/\\]\s*(\d{2,3})/i);
  if (bp) {
    vitals.bloodPressureSystolic = parseInt(bp[1]!, 10);
    vitals.bloodPressureDiastolic = parseInt(bp[2]!, 10);
  } else {
    const sys = t.match(/(?:systolic|sys)[:\s]*(\d{2,3})/i);
    const dia = t.match(/(?:diastolic|dia)[:\s]*(\d{2,3})/i);
    if (sys) vitals.bloodPressureSystolic = parseInt(sys[1]!, 10);
    if (dia) vitals.bloodPressureDiastolic = parseInt(dia[1]!, 10);
  }
}

export type LabExtractionResult = {
  vitals: ExtractedVitals;
  chartData: ChartPoint[];
  charts: ChartSeries[];
  markers: ParsedLabMarker[];
};

/** Extract structured vitals and lab values from OCR/PDF text. */
export function extractLabValuesFromText(text: string): LabExtractionResult {
  const t = text.replace(/\s+/g, " ");
  const markers = parseLabMarkersFromText(text);
  const vitals = markersToVitals(markers);
  parseBloodPressure(t, vitals);

  const { chartData, charts } = markersToChartData(markers);

  if (vitals.bloodPressureSystolic != null && vitals.bloodPressureDiastolic != null) {
    chartData.push(
      { label: "Systolic", value: vitals.bloodPressureSystolic, ref: "120", unit: "mmHg" },
      { label: "Diastolic", value: vitals.bloodPressureDiastolic, ref: "80", unit: "mmHg" },
    );
    charts.push({
      id: "bp-vitals",
      title: "Blood pressure",
      type: "vitals",
      data: [
        { label: "Systolic", value: vitals.bloodPressureSystolic, ref: "120", unit: "mmHg" },
        { label: "Diastolic", value: vitals.bloodPressureDiastolic, ref: "80", unit: "mmHg" },
      ],
    });
  }

  if (vitals.fastingGlucose != null && !chartData.some((c) => c.label.includes("glucose"))) {
    chartData.push({
      label: "Fasting glucose",
      value: vitals.fastingGlucose,
      ref: "70-100",
      unit: "mg/dL",
    });
  }

  return { vitals, chartData, charts, markers };
}
