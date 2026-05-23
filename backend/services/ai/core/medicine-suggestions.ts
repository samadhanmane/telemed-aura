const MEDICINE_MAP: Record<string, string[]> = {
  fever: ["Paracetamol 500mg", "Ibuprofen 400mg"],
  headache: ["Paracetamol 500mg", "Ibuprofen 400mg"],
  cough: ["Cough syrup (as prescribed)", "Steam inhalation"],
  cold: ["Paracetamol", "Antihistamine (if prescribed)"],
  hypertension: ["Amlodipine (doctor prescribed only)", "Lifestyle modification"],
  diabetes: ["Metformin (doctor prescribed only)", "Diet counseling"],
};

export function suggestMedicines(conditionKey: string): string[] {
  const key = conditionKey.toLowerCase().trim();
  for (const [k, meds] of Object.entries(MEDICINE_MAP)) {
    if (key.includes(k)) return meds;
  }
  return [];
}
