/** Mirrors backend/src/constants/specialties.ts — used when API is unreachable. */
export const DEFAULT_SPECIALTIES = [
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
