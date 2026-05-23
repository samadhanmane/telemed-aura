import { User, DoctorProfile, Appointment } from "../../database/models/index.js";
import { getSpecialtyLabel } from "../../constants/specialties.js";
import {
  APPOINTMENT_SLOT_TIMES,
  dayKeyFromDate,
  filterBookableSlots,
  getTodayDateString,
  isDateBeforeToday,
  isSlotWithinDaySchedule,
  normalizeAvailability,
  type DoctorAvailability,
} from "../../shared/appointment-slots.js";

export { APPOINTMENT_SLOT_TIMES };

export async function getDoctorProfileOrThrow(doctorId: string) {
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  if (!profile) throw new Error("Doctor profile not found");
  return profile;
}

export function getAvailabilityFromProfile(
  profile: { availability?: DoctorAvailability | null },
): DoctorAvailability {
  return normalizeAvailability(profile.availability ?? undefined);
}

/** Slots open on the doctor's schedule, not booked, and not in the past. */
export async function getAvailableSlots(doctorId: string, date: string) {
  if (isDateBeforeToday(date)) return [];

  const profile = await getDoctorProfileOrThrow(doctorId);
  const availability = getAvailabilityFromProfile(profile);

  if (!availability.acceptingAppointments) return [];
  if (availability.blockedDates.includes(date)) return [];

  const day = availability.weekly[dayKeyFromDate(date)];
  if (!day?.enabled) return [];

  const booked = await Appointment.find({
    doctorId,
    date,
    status: { $nin: ["cancelled"] },
  }).select("time");

  const taken = new Set(booked.map((b) => b.time));
  const open = APPOINTMENT_SLOT_TIMES.filter(
    (t) => !taken.has(t) && isSlotWithinDaySchedule(t, day),
  );
  return filterBookableSlots(date, open);
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return getTodayDateString(dt);
}

export async function getNextFreeSlot(
  doctorId: string,
  startDate?: string,
): Promise<{ date: string; time: string } | null> {
  let date = startDate ?? getTodayDateString();
  for (let i = 0; i < 14; i++) {
    const slots = await getAvailableSlots(doctorId, date);
    if (slots.length > 0) return { date, time: slots[0]! };
    date = addDays(date, 1);
  }
  return null;
}

export async function assertSlotAvailable(doctorId: string, date: string, time: string) {
  const slots = await getAvailableSlots(doctorId, date);
  if (!slots.includes(time)) {
    throw new Error(
      slots.length === 0
        ? "No free slots on this date — pick another day or update availability"
        : "This time is not available — choose a free slot",
    );
  }
}

export async function getMyAvailability(doctorId: string) {
  const profile = await getDoctorProfileOrThrow(doctorId);
  return getAvailabilityFromProfile(profile);
}

export async function updateMyAvailability(doctorId: string, data: Partial<DoctorAvailability>) {
  const profile = await getDoctorProfileOrThrow(doctorId);
  const current = getAvailabilityFromProfile(profile);
  const next = normalizeAvailability({
    acceptingAppointments: data.acceptingAppointments ?? current.acceptingAppointments,
    weekly: { ...current.weekly, ...data.weekly },
    blockedDates: data.blockedDates ?? current.blockedDates,
  });
  profile.availability = next;
  await profile.save();
  return next;
}

export async function listDoctors(specialty?: string) {
  const filter: Record<string, unknown> = { verified: true, verificationStatus: "approved" };
  if (specialty) filter.specialty = specialty;

  const profiles = await DoctorProfile.find(filter).lean();
  const userIds = profiles.map((p) => p.userId);
  const users = await User.find({ _id: { $in: userIds }, role: "doctor" }).lean();

  return profiles.map((p) => {
    const u = users.find((x) => x._id.toString() === p.userId.toString());
    return {
      id: u?._id.toString(),
      profileId: p._id.toString(),
      name: u?.name ?? "Doctor",
      email: u?.email,
      specialty: p.specialty,
      specialtyLabel: getSpecialtyLabel(p.specialty),
      experienceYears: p.experienceYears,
      rating: p.rating,
      reviewCount: p.reviewCount ?? 0,
      bio: p.bio,
      phone: u?.phone,
      location: u?.location,
      hospital: p.hospital ?? "Rural Telehealth Network",
      languages: p.languages ?? ["English", "Hindi"],
      qualifications: p.qualifications?.length
        ? p.qualifications
        : [`MBBS`, `${getSpecialtyLabel(p.specialty)} specialist`],
      verified: p.verified,
    };
  });
}
