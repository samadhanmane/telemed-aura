import type { EmailPayload } from "../types/email.types.js";

export function prescriptionTemplates(payload: EmailPayload) {
  return {
    subject: "New prescription — Telemed Aura",
    html: `<p>Your prescription is ready.</p>`,
    text: "Your prescription is ready.",
  };
}
