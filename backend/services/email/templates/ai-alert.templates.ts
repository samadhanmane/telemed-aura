import type { EmailPayload } from "../types/email.types.js";

export function aiAlertTemplates(payload: EmailPayload) {
  return {
    subject: "AI health alert — Telemed",
    html: `<p>Severity: ${payload.data.severity ?? "unknown"}</p>`,
    text: `AI alert — severity ${payload.data.severity ?? "unknown"}`,
  };
}
