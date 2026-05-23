import { useEffect } from "react";
import { fetchMe } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

/** Re-validates persisted JWT on app load */
export function SessionBootstrap() {
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!token) return;
    if (typeof localStorage !== "undefined" && !localStorage.getItem("telemed-auth-token")) {
      localStorage.setItem("telemed-auth-token", token);
    }
    let cancelled = false;
    fetchMe()
      .then((fresh) => {
        if (!cancelled) setSession(fresh, token);
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [token, setSession, logout]);

  return null;
}
