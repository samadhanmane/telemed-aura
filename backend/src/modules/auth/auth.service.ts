import bcrypt from "bcryptjs";
import { User, DoctorProfile } from "../../database/models/index.js";
import { signToken } from "../../shared/utils/jwt.js";
import type { SpecialtyId } from "../../constants/specialties.js";

const SALT_ROUNDS = 10;

export async function registerPatient(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const exists = await User.findOne({ email: data.email.toLowerCase() });
  if (exists) throw new Error("Email already registered");

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    role: "patient",
    phone: data.phone,
  });

  return toPublicUser(user);
}

export async function registerDoctor(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  specialty: SpecialtyId;
  licenseNumber: string;
  experienceYears: number;
  consultationFee: number;
  bio?: string;
}) {
  const exists = await User.findOne({ email: data.email.toLowerCase() });
  if (exists) throw new Error("Email already registered");

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    role: "doctor",
    phone: data.phone,
  });

  await DoctorProfile.create({
    userId: user._id,
    specialty: data.specialty,
    licenseNumber: data.licenseNumber,
    experienceYears: data.experienceYears,
    consultationFee: data.consultationFee,
    bio: data.bio,
  });

  return toPublicUser(user);
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) throw new Error("Invalid email or password");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("Invalid email or password");

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return { user: toPublicUser(user), token };
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  const base = toPublicUser(user);
  if (user.role === "doctor") {
    const profile = await DoctorProfile.findOne({ userId: user._id });
    return { ...base, doctorProfile: profile };
  }
  return base;
}

function toPublicUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  phone?: string;
  location?: string;
  healthScore?: number;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    location: user.location,
    healthScore: user.healthScore,
  };
}
