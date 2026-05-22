import { Link, useRouterState } from "@tanstack/react-router";
import { HeartPulse, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import type { NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types/healthcare";

function NavLinks({ items, pathname, onNavigate }: { items: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 p-3">
      {items.map((item) => {
        const base = item.to.replace(/\/$/, "") || item.to;
        const active =
          pathname === item.to ||
          pathname === base ||
          (item.to !== items[0]?.to && pathname.startsWith(item.to));
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-primary-soft font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className={cn("h-4 w-4", active && "text-primary")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar({
  items,
  title,
  role,
}: {
  items: NavItem[];
  title: string;
  role: UserRole;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  const brand = (
    <div className="flex h-16 items-center gap-2 border-b border-border/60 px-5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
        <HeartPulse className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">Telehealth</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      </div>
    </div>
  );

  const signOut = (
    <div className="border-t border-border/60 p-3">
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-muted-foreground"
        onClick={() => {
          logout();
          window.location.href = "/login";
        }}
      >
        <LogOut className="h-4 w-4" /> Logout
      </Button>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar lg:flex">
        {brand}
        <NavLinks items={items} pathname={pathname} />
        {signOut}
      </aside>

      <div className="fixed left-4 top-3 z-40 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="bg-background/80 backdrop-blur">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            {brand}
            <NavLinks items={items} pathname={pathname} onNavigate={() => setOpen(false)} />
            {signOut}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
