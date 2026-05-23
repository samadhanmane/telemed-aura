import type { PossibleDisease } from "../core/types.js";

/** Merge value-based inference with Gemini possible diseases for display. */
export function mergePossibleDiseases(
  fromRules: PossibleDisease[],
  gemini?: PossibleDisease[] | null,
): PossibleDisease[] {
  const byName = new Map<string, PossibleDisease>();

  for (const d of fromRules) {
    byName.set(d.name.toLowerCase(), d);
  }

  for (const d of gemini ?? []) {
    const key = d.name.toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      byName.set(key, {
        ...existing,
        source: "both",
        likelihood: d.likelihood || existing.likelihood,
        note: d.note ?? existing.note,
      });
    } else {
      byName.set(key, d);
    }
  }

  return [...byName.values()].slice(0, 8);
}
