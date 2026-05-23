import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types/healthcare";
import { isSafeRedirect, resolveRedirectAfterLogin } from "./require-login";

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "doctor":
      return "/doctor";
    case "admin":
      return "/admin";
    default:
      return "/patient";
  }
}

export function requireAuth() {
  const { user, token } = useAuthStore.getState();
  if (!user || !token) {
    throw redirect({ to: "/login", search: {} });
  }
  return user;
}

export function requireRole(role: UserRole) {
  const user = requireAuth();
  if (user.role !== role) {
    throw redirect({ to: getDashboardPath(user.role as UserRole) });
  }
  return user;
}

/** Send already-signed-in users away from login/register (optional post-login redirect). */
export function redirectIfAuthenticated(search?: { redirect?: string }) {
  const { user, token } = useAuthStore.getState();
  if (user && token) {
    const dest =
      search?.redirect && isSafeRedirect(search.redirect)
        ? resolveRedirectAfterLogin(search.redirect, user.role as UserRole)
        : getDashboardPath(user.role as UserRole);
    throw redirect({ to: dest });
  }
}
