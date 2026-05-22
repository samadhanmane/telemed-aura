import { getTransporter } from "../client/nodemailer.client.js";
import { getMailConfig } from "../config/mail.config.js";
import { renderTemplate } from "../templates/index.js";
import type { EmailPayload, EmailRecipientRole } from "../types/email.types.js";

/**
 * Core send — picks template, resolves patient/doctor inbox.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const transport = getTransporter();
  const { from } = getMailConfig();
  const { html, text, subject } = await renderTemplate(payload);

  await transport.sendMail({
    from,
    to: payload.to,
    subject,
    html,
    text,
  });
}

export function resolveRecipients(
  role: EmailRecipientRole,
  emails: { patient?: string; doctor?: string },
): string[] {
  if (role === "both") {
    return [emails.patient, emails.doctor].filter(Boolean) as string[];
  }
  return role === "doctor" && emails.doctor
    ? [emails.doctor]
    : emails.patient
      ? [emails.patient]
      : [];
}

export const emailService = { sendEmail, resolveRecipients };
