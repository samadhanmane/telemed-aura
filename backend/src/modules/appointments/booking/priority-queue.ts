import type { SeverityLevel } from "../../../shared/types/index.js";

/**
 * Priority queue for rural telehealth — higher severity = earlier slot.
 * critical > high > moderate > low
 */
const SEVERITY_WEIGHT: Record<SeverityLevel, number> = {
  critical: 4,
  high: 3,
  moderate: 2,
  low: 1,
};

export interface QueuedBooking {
  id: string;
  patientId: string;
  doctorId: string;
  severity: SeverityLevel;
  requestedAt: Date;
}

export function compareBySeverity(a: QueuedBooking, b: QueuedBooking): number {
  const diff = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
  if (diff !== 0) return diff;
  return a.requestedAt.getTime() - b.requestedAt.getTime();
}
