import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/api/auth";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setSession: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (user, token) => {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("telemed-auth-token", token);
        }
        set({ user, token });
      },
      logout: () => {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("telemed-auth-token");
        }
        set({ user: null, token: null });
      },
    }),
    { name: "telemed-auth" },
  ),
);
