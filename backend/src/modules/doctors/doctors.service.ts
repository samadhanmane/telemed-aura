import { User, DoctorProfile, Appointment } from "../../database/models/index.js";
import { getSpecialtyLabel } from "../../constants/specialties.js";

const SLOT_TIMES = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
];

export async function listDoctors(specialty?: string) {
  const filter: Record<string, unknown> = { verified: true };
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
      consultationFee: p.consultationFee,
      rating: p.rating,
      bio: p.bio,
      phone: u?.phone,
    };
  });
}

export async function getAvailableSlots(doctorId: string, date: string) {
  const booked = await Appointment.find({
    doctorId,
    date,
    status: { $nin: ["cancelled"] },
  }).select("time");

  const taken = new Set(booked.map((b) => b.time));
  return SLOT_TIMES.filter((t) => !taken.has(t));
}
