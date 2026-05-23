import { searchChunksHybrid, type RetrievedChunk } from "../store/mongo-vector-store.js";

const MEDICAL_TERMS =
  /\b(bp|blood pressure|glucose|sugar|hba1c|ldl|hdl|cholesterol|hemoglobin|hb|wbc|platelet|creatinine|tsh|vitamin|x-?ray|mri|ct|ecg|prescription|medicine|mg|mmol)\b/gi;

function medicalTermBoost(query: string, text: string): number {
  const medical = (query.match(MEDICAL_TERMS) ?? []).filter((m) =>
    text.toLowerCase().includes(m.toLowerCase()),
  ).length;
  return Math.min(0.08, medical * 0.02);
}

/** Vector search (one embed) + keyword/medical boosts across rewritten sub-queries. */
export async function hybridRetrieve(
  patientId: string,
  queries: string[],
  opts?: { topK?: number; documentIds?: string[] },
): Promise<RetrievedChunk[]> {
  const unique = [...new Set(queries.map((q) => q.trim()).filter(Boolean))];
  if (!unique.length) return [];

  const primary = unique[0]!;
  const extra = unique.slice(1);

  const hits = await searchChunksHybrid(patientId, primary, extra, {
    topK: (opts?.topK ?? 12) + 4,
    minScore: 0.2,
    documentIds: opts?.documentIds,
  });

  return hits
    .map((h) => ({
      ...h,
      score: Math.min(1, h.score + medicalTermBoost(primary, h.text)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, opts?.topK ?? 12);
}
