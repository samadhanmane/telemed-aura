/**
 * Links appointment booking (severity priority) → video room creation → email invite.
 */

export async function onAppointmentConfirmed(_appointmentId: string): Promise<void> {
  /* 1. Create room 2. Email patient + doctor via services/email */
}
