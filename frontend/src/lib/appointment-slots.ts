/** Must match backend APPOINTMENT_SLOT_TIMES */
export const APPOINTMENT_SLOT_TIMES = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
] as const;

function parseSlotToMinutes(slot: string): number {
  const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return -1;
  let h = Number(match[1]);
  const min = Number(match[2]);
  const ap = match[3]!.toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

export function getTodayDateString(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isDateBeforeToday(date: string, now = new Date()): boolean {
  return date < getTodayDateString(now);
}

export function slotToLocalDate(date: string, slot: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const mins = parseSlotToMinutes(slot);
  if (mins < 0) return new Date(NaN);
  const h = Math.floor(mins / 60);
  const min = mins % 60;
  return new Date(y, m - 1, d, h, min, 0, 0);
}

/** Appointment slot start is in the past (for hiding join/book actions). */
export function isAppointmentInPast(date: string, time: string, now = new Date()): boolean {
  if (isDateBeforeToday(date, now)) return true;
  if (date > getTodayDateString(now)) return false;
  const start = slotToLocalDate(date, time);
  return Number.isNaN(start.getTime()) || start.getTime() <= now.getTime();
}
