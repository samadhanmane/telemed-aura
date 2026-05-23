import type { PrescriptionOcrResult } from "./types.js";

export function parsePrescriptionText(text: string): PrescriptionOcrResult {
  const lines = text.split(/\n|,|;/).map((l) => l.trim()).filter(Boolean);
  const medicines: PrescriptionOcrResult["medicines"] = [];

  const patterns = [
    /([A-Za-z][A-Za-z0-9\s-]*(?:\d+\s*mg)?)\s*[-–]?\s*(\d+\s*(?:tab|tablet|cap|ml)?)?\s*[-–]?\s*(\d+x?\s*(?:daily|day|bd|tds)|(?:after|before)\s*meals)?/i,
  ];

  for (const line of lines) {
    if (line.length < 3) continue;
    let matched = false;
    for (const p of patterns) {
      const m = line.match(p);
      if (m) {
        medicines.push({
          name: (m[1] ?? line).trim(),
          dosage: m[2]?.trim() || "As directed",
          frequency: m[3]?.trim() || "Daily",
          duration: "5 days",
        });
        matched = true;
        break;
      }
    }
    if (!matched && /mg|tab|cap|syrup|tablet/i.test(line)) {
      medicines.push({ name: line, dosage: "As directed", frequency: "Daily", duration: "5 days" });
    }
  }

  if (medicines.length === 0 && text.length > 5) {
    medicines.push({
      name: text.slice(0, 120),
      dosage: "Review with doctor",
      frequency: "—",
      duration: "—",
    });
  }

  const confidence =
    medicines.length > 0 && medicines[0].name.length > 3 ? Math.min(0.92, 0.5 + medicines.length * 0.1) : 0.25;

  return { text, confidence, medicines };
}
