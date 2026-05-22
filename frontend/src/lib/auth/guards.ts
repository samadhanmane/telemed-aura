import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types/healthcare";

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
    throw redirect({ to: "/login" });
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
