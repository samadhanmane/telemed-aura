import bcrypt from "bcryptjs";
import { User, DoctorProfile } from "../../database/models/index.js";
import { signToken } from "../../shared/utils/jwt.js";
import type { SpecialtyId } from "../../constants/specialties.js";
import { isEnvAdminLogin, getAdminCredentials } from "../../config/admin.js";
import { uploadToCloudinary, isCloudinaryConfigured } from "../../integrations/cloudinary.service.js";
import { getSpecialtyLabel } from "../../constants/specialties.js";

const SALT_ROUNDS = 10;

export async function registerPatient(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  location?: string;
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
    location: data.location,
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
  bio?: string;
  certificateBuffer: Buffer;
  certificateMimeType: string;
  certificateFilename: string;
}) {
  const email = data.email.toLowerCase();
  const exists = await User.findOne({ email });
  if (exists) {
    const profile = await DoctorProfile.findOne({ userId: exists._id });
    if (profile?.verificationStatus === "pending") {
      throw new Error("Registration already submitted — wait for admin approval or contact support");
    }
    if (profile?.verificationStatus === "approved") {
      throw new Error("Email already registered — sign in instead");
    }
    await User.findByIdAndDelete(exists._id);
    await DoctorProfile.deleteOne({ userId: exists._id });
  }

  if (!isCloudinaryConfigured()) {
    throw new Error("File storage is not configured — cannot upload certificate");
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await User.create({
    name: data.name,
    email,
    passwordHash,
    role: "doctor",
    phone: data.phone,
  });

  const upload = await uploadToCloudinary(data.certificateBuffer, {
    folder: `telemed-aura/certificates/${user._id}`,
    filename: data.certificateFilename,
    mimeType: data.certificateMimeType,
  });

  await DoctorProfile.create({
    userId: user._id,
    specialty: data.specialty,
    licenseNumber: data.licenseNumber,
    experienceYears: data.experienceYears,
    consultationFee: 0,
    bio: data.bio,
    verified: false,
    verificationStatus: "pending",
    certificateUrl: upload.secureUrl,
    certificatePublicId: upload.publicId,
  });

  return {
    pending: true as const,
    email: user.email,
    message:
      "Your registration and medical certificate were submitted. An admin will review your application. You can sign in after approval.",
  };
}

export async function login(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  if (isEnvAdminLogin(normalizedEmail, password)) {
    const user = await ensureAdminUser();
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: "admin",
    });
    return { user, token };
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user) throw new Error("Invalid email or password");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("Invalid email or password");

  if (user.role === "doctor") {
    const profile = await DoctorProfile.findOne({ userId: user._id.toString() });
    if (!profile || profile.verificationStatus === "pending") {
      const err = new Error(
        "Your doctor registration is pending admin review. You will be able to sign in after approval.",
      ) as Error & { code?: string };
      err.code = "REGISTRATION_PENDING";
      throw err;
    }
    if (profile.verificationStatus === "rejected") {
      const err = new Error(
        "Your registration was not approved. Please register again with an updated medical certificate.",
      ) as Error & { code?: string };
      err.code = "REGISTRATION_REJECTED";
      throw err;
    }
  }

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return { user: await toPublicUserWithProfile(user), token };
}

async function ensureAdminUser() {
  const { email, password, name } = getAdminCredentials();
  if (!email || !password) {
    throw new Error("Admin credentials are not configured on the server");
  }

  let user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    user = await User.create({
      name,
      email,
      passwordHash,
      role: "admin",
    });
  } else if (user.role !== "admin") {
    user.role = "admin";
    await user.save();
  }

  return toPublicUser(user);
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  return toPublicUserWithProfile(user);
}

export async function updateProfile(userId: string, data: { name?: string; phone?: string }) {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      ...(data.name != null ? { name: data.name.trim() } : {}),
      ...(data.phone != null ? { phone: data.phone.trim() } : {}),
    },
    { new: true },
  );
  if (!user) throw new Error("User not found");
  return toPublicUserWithProfile(user);
}

async function toPublicUserWithProfile(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  phone?: string;
  location?: string;
  healthScore?: number;
}) {
  const base = toPublicUser(user);
  if (user.role === "doctor") {
    const profile = await DoctorProfile.findOne({ userId: user._id.toString() });
    return {
      ...base,
      doctorProfile: profile
        ? {
            specialty: profile.specialty,
            specialtyLabel: getSpecialtyLabel(profile.specialty),
            licenseNumber: profile.licenseNumber,
            experienceYears: profile.experienceYears,
            verified: profile.verified,
            verificationStatus: profile.verificationStatus,
            rating: profile.rating,
            reviewCount: profile.reviewCount,
          }
        : undefined,
    };
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
