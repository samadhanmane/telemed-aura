export type EmailTemplateId =
  | "appointment_booked"
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "appointment_reminder"
  | "prescription_new"
  | "doctor_message"
  | "ai_alert"
  | "video_consult_invite"
  | "video_consult_reminder"
  | "system_update";

export type EmailRecipientRole = "patient" | "doctor" | "both";

export interface EmailPayload {
  templateId: EmailTemplateId;
  to: string;
  data: Record<string, string | number>;
}
