/**
 * Outbound mail queue — retry on failure (poor village connectivity).
 * Plug BullMQ / Redis when ready.
 */

export interface MailJob {
  id: string;
  payload: unknown;
  attempts: number;
}

export async function enqueueMail(_job: MailJob): Promise<void> {
  /* TODO */
}
