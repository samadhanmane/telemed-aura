/** Must match backend shared/appointment-slots.ts */

function formatSlotLabel(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const min = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  let h12 = hours24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(min).padStart(2, "0")} ${period}`;
}

export function buildAppointmentSlotTimes(intervalMinutes = 30): string[] {
  const slots: string[] = [];
  for (let m = 0; m < 24 * 60; m += intervalMinutes) {
    slots.push(formatSlotLabel(m));
  }
  return slots;
}

export const APPOINTMENT_SLOT_TIMES = buildAppointmentSlotTimes();

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

/** Hide slots that already started today (15 min buffer). */
function slotToLocalDateFromTime(date: string, time: string): Date {
  const mins = parseTimeToMinutes(time);
  if (mins < 0) return new Date(NaN);
  const [y, mo, d] = date.split("-").map(Number);
  const h = Math.floor(mins / 60);
  const min = mins % 60;
  return new Date(y, mo - 1, d, h, min, 0, 0);
}

export function isSlotInPast(
  date: string,
  slot: string,
  now = new Date(),
  bufferMinutes = 15,
): boolean {
  if (isDateBeforeToday(date, now)) return true;
  if (date > getTodayDateString(now)) return false;
  const slotStart = slotToLocalDateFromTime(date, slot);
  if (Number.isNaN(slotStart.getTime())) return true;
  const cutoff = new Date(now.getTime() + bufferMinutes * 60 * 1000);
  return slotStart < cutoff;
}

export function filterBookableSlots(date: string, slots: readonly string[], now = new Date()): string[] {
  if (isDateBeforeToday(date, now)) return [];
  return slots.filter((s) => !isSlotInPast(date, s, now));
}

/** Parse UI label (9:00 AM) or 24h (09:00). */
export function parseTimeToMinutes(time: string): number {
  const trimmed = time.trim();
  const twelve = parseSlotToMinutes(trimmed);
  if (twelve >= 0) return twelve;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return -1;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return -1;
  return h * 60 + m;
}

/** Send HH:mm to API (matches backend storage). */
export function normalizeSlotTimeForStorage(time: string): string {
  const mins = parseTimeToMinutes(time);
  if (mins < 0) throw new Error("Invalid time slot");
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Appointment slot start is in the past (for hiding join/book actions). */
export function isAppointmentInPast(date: string, time: string, now = new Date()): boolean {
  if (isDateBeforeToday(date, now)) return true;
  if (date > getTodayDateString(now)) return false;
  const start = slotToLocalDate(date, time);
  return Number.isNaN(start.getTime()) || start.getTime() <= now.getTime();
}
