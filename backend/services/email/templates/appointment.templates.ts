import type { EmailPayload } from "../types/email.types.js";

export function appointmentTemplates(payload: EmailPayload) {
  return {
    subject: `Appointment — ${payload.templateId}`,
    html: `<p>Appointment notification</p>`,
    text: `Appointment notification`,
  };
}
