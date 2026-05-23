import { analyzeSymptoms } from "../core/symptom-analyzer.js";
import type { ScannerInput } from "./scanner.types.js";

export function runSymptomAnalysis(input: ScannerInput & {
  age?: number;
  chronicDiseases?: string[];
}) {
  return analyzeSymptoms(input);
}
