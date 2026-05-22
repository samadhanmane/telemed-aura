export const SPECIALTIES = [
  { id: "general_physician", label: "General Physician" },
  { id: "psychology", label: "Psychology / Mental Health" },
  { id: "dermatology", label: "Dermatology" },
  { id: "physiotherapy", label: "Physiotherapy" },
  { id: "cardiology", label: "Cardiology" },
  { id: "pediatrics", label: "Pediatrics" },
  { id: "gynecology", label: "Gynecology" },
  { id: "neurology", label: "Neurology" },
  { id: "orthopedics", label: "Orthopedics" },
  { id: "ent", label: "ENT" },
] as const;

export type SpecialtyId = (typeof SPECIALTIES)[number]["id"];

export function getSpecialtyLabel(id: string): string {
  return SPECIALTIES.find((s) => s.id === id)?.label ?? id;
}
