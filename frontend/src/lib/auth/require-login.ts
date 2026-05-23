import type { UserRole } from "@/types/healthcare";
import { useAuthStore } from "@/stores/auth-store";
import { getDashboardPath } from "./guards";

/** Patient paths that require sign-in from the marketing site. */
export const AUTH_GATED_PATHS = {
  aiScanner: "/patient/ai-scanner",
  getStarted: "/patient",
} as const;

export function isAuthenticated(): boolean {
  const { user, token } = useAuthStore.getState();
  return Boolean(user && token);
}

/** Only allow in-app relative paths (no open redirects). */
export function isSafeRedirect(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.startsWith("/login") || path.startsWith("/register")) return false;
  return true;
}

export function resolveRedirectAfterLogin(
  redirect: string | undefined,
  role: UserRole,
): string {
  if (!redirect || !isSafeRedirect(redirect)) {
    return getDashboardPath(role);
  }
  if (redirect.startsWith("/patient") && role !== "patient") {
    return getDashboardPath(role);
  }
  return redirect;
}

export function loginSearchFor(destination: string): { redirect: string } {
  return { redirect: destination };
}

/** Where to send a logged-in user for a marketing CTA. */
export function destinationForLoggedInUser(
  intent: keyof typeof AUTH_GATED_PATHS,
  role: UserRole,
): string {
  const target = AUTH_GATED_PATHS[intent];
  if (target.startsWith("/patient") && role !== "patient") {
    return getDashboardPath(role);
  }
  return target;
}
