/** Standard consultation slots (must match patient booking UI). */
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

export type AppointmentSlotTime = (typeof APPOINTMENT_SLOT_TIMES)[number];

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type DaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
};

export type DoctorAvailability = {
  acceptingAppointments: boolean;
  weekly: Record<DayKey, DaySchedule>;
  blockedDates: string[];
};

export const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const DEFAULT_DOCTOR_AVAILABILITY: DoctorAvailability = {
  acceptingAppointments: true,
  weekly: {
    sun: { enabled: false, start: "09:00", end: "17:00" },
    mon: { enabled: true, start: "09:00", end: "17:30" },
    tue: { enabled: true, start: "09:00", end: "17:30" },
    wed: { enabled: true, start: "09:00", end: "17:30" },
    thu: { enabled: true, start: "09:00", end: "17:30" },
    fri: { enabled: true, start: "09:00", end: "17:30" },
    sat: { enabled: true, start: "09:00", end: "13:00" },
  },
  blockedDates: [],
};

export function dayKeyFromDate(date: string): DayKey {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return DAY_KEYS[day]!;
}

function parseTime24ToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

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

export function isSlotWithinDaySchedule(slot: string, day: DaySchedule): boolean {
  if (!day.enabled) return false;
  const slotMin = parseSlotToMinutes(slot);
  if (slotMin < 0) return false;
  const start = parseTime24ToMinutes(day.start);
  const end = parseTime24ToMinutes(day.end);
  return slotMin >= start && slotMin <= end;
}

/** Local calendar date YYYY-MM-DD */
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

/** True if this date/time is no longer bookable (past day, or today before slot + buffer). */
export function isSlotInPast(
  date: string,
  slot: string,
  now = new Date(),
  bufferMinutes = 15,
): boolean {
  if (isDateBeforeToday(date, now)) return true;
  if (date > getTodayDateString(now)) return false;
  const slotStart = slotToLocalDate(date, slot);
  if (Number.isNaN(slotStart.getTime())) return true;
  const cutoff = new Date(now.getTime() + bufferMinutes * 60 * 1000);
  return slotStart < cutoff;
}

export function filterBookableSlots(
  date: string,
  slots: readonly string[],
  now = new Date(),
): string[] {
  if (isDateBeforeToday(date, now)) return [];
  return slots.filter((s) => !isSlotInPast(date, s, now));
}

export function normalizeAvailability(raw?: Partial<DoctorAvailability> | null): DoctorAvailability {
  if (!raw?.weekly) return DEFAULT_DOCTOR_AVAILABILITY;
  const weekly = { ...DEFAULT_DOCTOR_AVAILABILITY.weekly };
  for (const key of DAY_KEYS) {
    if (raw.weekly[key]) {
      weekly[key] = {
        enabled: raw.weekly[key]!.enabled ?? weekly[key].enabled,
        start: raw.weekly[key]!.start ?? weekly[key].start,
        end: raw.weekly[key]!.end ?? weekly[key].end,
      };
    }
  }
  return {
    acceptingAppointments: raw.acceptingAppointments ?? true,
    weekly,
    blockedDates: Array.isArray(raw.blockedDates) ? raw.blockedDates : [],
  };
}
