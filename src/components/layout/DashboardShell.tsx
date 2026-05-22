import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import type { NavItem } from "@/lib/nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DashboardShell({
  nav,
  title,
  children,
}: {
  nav: NavItem[];
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar items={nav} title={title} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-8">
          <div className="relative hidden flex-1 max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search doctors, prescriptions, reports…" className="pl-9" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="ml-1 flex items-center gap-3 rounded-full border border-border/60 bg-surface px-2 py-1 pr-3">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-accent text-xs font-semibold text-accent-foreground">
                AP
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <div className="text-xs font-semibold">Aarav Patil</div>
                <div className="text-[10px] text-muted-foreground">Patient</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
