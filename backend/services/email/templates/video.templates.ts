import type { EmailPayload } from "../types/email.types.js";

export function videoTemplates(payload: EmailPayload) {
  return {
    subject: "Video consultation — Telemed Aura",
    html: `<p>Join your secure video consult: ${payload.data.joinUrl ?? ""}</p>`,
    text: `Join: ${payload.data.joinUrl ?? ""}`,
  };
}
