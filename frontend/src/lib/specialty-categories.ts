import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Baby,
  Bone,
  Brain,
  HeartPulse,
  Sparkles,
  Stethoscope,
} from "lucide-react";

export type SpecialtyCategoryId =
  | "primary"
  | "mental"
  | "skin"
  | "heart"
  | "children"
  | "bones"
  | "specialist";

export type SpecialtyCategory = {
  id: SpecialtyCategoryId;
  labelKey: string;
  icon: LucideIcon;
};

export const SPECIALTY_CATEGORIES: SpecialtyCategory[] = [
  { id: "primary", labelKey: "specialtyCategories.primary", icon: Stethoscope },
  { id: "mental", labelKey: "specialtyCategories.mental", icon: Brain },
  { id: "skin", labelKey: "specialtyCategories.skin", icon: Sparkles },
  { id: "heart", labelKey: "specialtyCategories.heart", icon: HeartPulse },
  { id: "children", labelKey: "specialtyCategories.children", icon: Baby },
  { id: "bones", labelKey: "specialtyCategories.bones", icon: Bone },
  { id: "specialist", labelKey: "specialtyCategories.specialist", icon: Activity },
];

/** Maps backend specialty id → sidebar category */
export const SPECIALTY_CATEGORY_MAP: Record<string, SpecialtyCategoryId> = {
  general_physician: "primary",
  psychology: "mental",
  dermatology: "skin",
  physiotherapy: "bones",
  cardiology: "heart",
  pediatrics: "children",
  gynecology: "children",
  neurology: "specialist",
  orthopedics: "bones",
  ent: "specialist",
};

export function getCategoryForSpecialty(specialtyId: string): SpecialtyCategoryId {
  return SPECIALTY_CATEGORY_MAP[specialtyId] ?? "specialist";
}
