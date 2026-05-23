import type { ComponentProps, ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import {
  destinationForLoggedInUser,
  isAuthenticated,
  loginSearchFor,
  type AUTH_GATED_PATHS,
} from "@/lib/auth/require-login";
import type { UserRole } from "@/types/healthcare";

type Intent = keyof typeof AUTH_GATED_PATHS;

type AuthGatedButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  intent: Intent;
  children: ReactNode;
};

export function AuthGatedButton({ intent, children, ...buttonProps }: AuthGatedButtonProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const handleClick = () => {
    const destination =
      intent === "aiScanner" ? "/patient/ai-scanner" : "/patient";

    if (isAuthenticated() && user && token) {
      navigate({
        to: destinationForLoggedInUser(intent, user.role as UserRole),
      });
      return;
    }

    navigate({
      to: "/login",
      search: loginSearchFor(destination),
    });
  };

  return (
    <Button type="button" onClick={handleClick} {...buttonProps}>
      {children}
    </Button>
  );
}
