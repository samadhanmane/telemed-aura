/**
 * Nodemailer transport config — read from process.env (SMTP_HOST, SMTP_PORT, etc.)
 */

export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export function getMailConfig(): MailConfig {
  const user = process.env.SMTP_USER ?? process.env.EMAIL ?? "";
  const pass = process.env.SMTP_PASS ?? process.env.EMAIL_PASSWORD ?? "";
  const from = process.env.MAIL_FROM ?? process.env.EMAIL ?? user;

  return {
    host: process.env.SMTP_HOST ?? (user.includes("@gmail.") ? "smtp.gmail.com" : ""),
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user,
    pass,
    from,
  };
}
