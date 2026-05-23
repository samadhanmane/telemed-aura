import { loadEnv } from "./env.js";

loadEnv();

export function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Platform Admin";
  return { email, password, name };
}

export function isEnvAdminLogin(email: string, password: string): boolean {
  const { email: adminEmail, password: adminPassword } = getAdminCredentials();
  if (!adminEmail || !adminPassword) return false;
  return email.trim().toLowerCase() === adminEmail && password === adminPassword;
}
