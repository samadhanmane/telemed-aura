import bcrypt from "bcryptjs";
import { User, PasswordResetOtp } from "../../database/models/index.js";
import { sendPasswordResetOtpEmail } from "../../services/mail.service.js";
import { getAdminCredentials } from "../../config/admin.js";

const OTP_TTL_MS = 2 * 60 * 1000;
const OTP_LENGTH = 6;
const SALT_ROUNDS = 10;

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function generateOtp(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

function isSmtpConfigured(): boolean {
  const user = (process.env.EMAIL ?? process.env.SMTP_USER ?? "").trim();
  const pass = (process.env.EMAIL_PASSWORD ?? process.env.SMTP_PASS ?? "").trim();
  return Boolean(user && pass);
}

function isAdminEmail(email: string): boolean {
  const { email: adminEmail } = getAdminCredentials();
  return Boolean(adminEmail && email === adminEmail);
}

/** Always returns generic success message (no email enumeration). */
export async function requestPasswordResetOtp(email: string) {
  const normalized = normalizeEmail(email);
  const generic = {
    message:
      "If an account exists for this email, a verification code has been sent. It expires in 2 minutes.",
  };

  if (isAdminEmail(normalized)) {
    return generic;
  }

  const user = await User.findOne({ email: normalized });
  if (!user) return generic;

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await PasswordResetOtp.deleteMany({ email: normalized });
  await PasswordResetOtp.create({ email: normalized, otpHash, expiresAt });

  if (isSmtpConfigured()) {
    try {
      await sendPasswordResetOtpEmail({
        to: user.email,
        name: user.name,
        otp,
        expiresMinutes: 2,
      });
    } catch (err) {
      await PasswordResetOtp.deleteMany({ email: normalized });
      console.error("[password-reset] Failed to send OTP email:", err);
      throw new Error("Could not send verification email. Check SMTP settings and try again.");
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.info(`[password-reset] DEV OTP for ${normalized}: ${otp} (expires in 2 min)`);
  } else {
    await PasswordResetOtp.deleteMany({ email: normalized });
    throw new Error("Email service is not configured. Contact support.");
  }

  return generic;
}

export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  newPassword: string,
) {
  const normalized = normalizeEmail(email);
  const code = otp.replace(/\D/g, "").trim();

  if (!code || code.length !== OTP_LENGTH) {
    throw new Error("Enter the 6-digit code from your email");
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  if (isAdminEmail(normalized)) {
    throw new Error("Admin password cannot be reset here. Update ADMIN_PASSWORD in server config.");
  }

  const record = await PasswordResetOtp.findOne({ email: normalized }).sort({ createdAt: -1 });
  if (!record) {
    throw new Error("No verification code found. Request a new code.");
  }
  if (record.expiresAt.getTime() < Date.now()) {
    await PasswordResetOtp.deleteMany({ email: normalized });
    throw new Error("Verification code expired. Request a new code.");
  }

  const valid = await bcrypt.compare(code, record.otpHash);
  if (!valid) {
    throw new Error("Invalid verification code. Only the latest code from your email works.");
  }

  const user = await User.findOne({ email: normalized }).select("+passwordHash");
  if (!user) {
    await PasswordResetOtp.deleteMany({ email: normalized });
    throw new Error("Account not found");
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
  await PasswordResetOtp.deleteMany({ email: normalized });

  return { message: "Password updated. You can sign in with your new password." };
}
