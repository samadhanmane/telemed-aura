const EMERGENCY_SYMPTOMS = [
  "chest pain",
  "difficulty breathing",
  "shortness of breath",
  "severe bleeding",
  "unconscious",
  "stroke",
  "heart attack",
  "seizure",
  "cannot breathe",
  "crushing pain",
];

export function detectEmergency(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_SYMPTOMS.some((s) => lower.includes(s));
}

export function getEmergencyRecommendation(): string {
  return "Seek urgent medical care immediately or book an emergency video consultation.";
}
