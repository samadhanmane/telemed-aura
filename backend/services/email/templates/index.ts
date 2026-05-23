import type { EmailPayload } from "../types/email.types.js";
import { appointmentTemplates } from "./appointment.templates.js";
import { prescriptionTemplates } from "./prescription.templates.js";
import { videoTemplates } from "./video.templates.js";
import { aiAlertTemplates } from "./ai-alert.templates.js";

export async function renderTemplate(payload: EmailPayload) {
  switch (payload.templateId) {
    case "appointment_booked":
    case "appointment_confirmed":
    case "appointment_cancelled":
    case "appointment_reminder":
      return appointmentTemplates(payload);
    case "prescription_new":
      return prescriptionTemplates(payload);
    case "video_consult_invite":
    case "video_consult_reminder":
      return videoTemplates(payload);
    case "ai_alert":
      return aiAlertTemplates(payload);
    default:
      return {
        subject: "Telemed",
        html: "<p>Notification</p>",
        text: "Notification",
      };
  }
}
