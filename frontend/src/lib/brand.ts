/** Site branding — use everywhere instead of hardcoding product name. */
export const APP_NAME = "Telemed";

export const APP_TAGLINE = "Specialist care, delivered online";

export const APP_DESCRIPTION =
  "Book video consults with specialists, scan symptoms with AI, and keep every medical record in one secure place.";

export function pageTitle(page?: string): string {
  return page ? `${page} — ${APP_NAME}` : `${APP_NAME} — ${APP_TAGLINE}`;
}
