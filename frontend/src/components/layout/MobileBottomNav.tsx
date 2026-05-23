import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getMobileNav } from "@/lib/nav";
import type { UserRole } from "@/types/healthcare";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ role }: { role: UserRole }) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = getMobileNav(role);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border/60 bg-background/95 px-2 py-2 backdrop-blur-xl lg:hidden">
      {items.map((item) => {
        const active =
          pathname === item.to ||
          (item.to !== `/${role}` && pathname.startsWith(item.to));
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] transition-colors",
              active ? "text-primary font-medium" : "text-muted-foreground",
            )}
          >
            <Icon className={cn("h-5 w-5", active && "text-primary")} />
            <span className="truncate px-1">{(item.label ?? t(item.labelKey)).split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
