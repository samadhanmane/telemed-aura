import { Link } from "@tanstack/react-router";
import { Search, Bell, Moon, Sun, LogOut, User, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  useNotifications,
  useMarkNotificationRead,
} from "@/lib/api/hooks/use-notifications";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRoleTitle } from "@/hooks/use-translated-nav";
import type { UserRole } from "@/types/healthcare";
import { cn } from "@/lib/utils";

export function DashboardNavbar({ role }: { role: UserRole }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const roleTitle = useRoleTitle(role);
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const unread = notifications.filter((n) => !n.read).length;
  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "U";

  const settingsPath =
    role === "patient"
      ? "/patient/settings"
      : role === "doctor"
        ? "/doctor/settings"
        : "/admin/settings";

  const notificationsPath =
    role === "patient"
      ? "/patient/notifications"
      : role === "doctor"
        ? "/doctor/notifications"
        : "/admin/notifications";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("common.search")}
          className="border-border/60 bg-surface/80 pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitcher />

        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <p className="text-sm font-semibold">{t("common.notifications")}</p>
              <Link to={notificationsPath} className="text-xs text-primary hover:underline">
                {t("common.viewAll")}
              </Link>
            </div>
            <ScrollArea className="h-72">
              {notifications.length === 0 && (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  {t("common.noNotifications")}
                </p>
              )}
              {notifications.slice(0, 5).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead.mutate(n.id)}
                  className={cn(
                    "w-full border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    !n.read && "bg-primary-soft/30",
                  )}
                >
                  <p className="text-xs font-semibold">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{n.time}</p>
                </button>
              ))}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-3 rounded-full border border-border/60 bg-surface px-2 py-1 pr-3 transition-colors hover:bg-muted/50"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-accent text-xs font-semibold text-accent-foreground">
                {initials}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <div className="text-xs font-semibold">{user?.name ?? "User"}</div>
                <div className="text-[10px] text-muted-foreground">{roleTitle}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t("common.myAccount")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={settingsPath}>
                <User className="mr-2 h-4 w-4" /> {t("common.profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={settingsPath}>
                <Settings className="mr-2 h-4 w-4" /> {t("common.settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> {t("common.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
