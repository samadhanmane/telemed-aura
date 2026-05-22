import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { DashboardNavbar } from "./DashboardNavbar";
import { HealthInsightsPanel } from "./HealthInsightsPanel";
import { MobileBottomNav } from "./MobileBottomNav";
import type { NavItem } from "@/lib/nav";
import type { UserRole } from "@/types/healthcare";

export function DashboardShell({
  nav,
  title,
  role,
  children,
  showInsights = false,
}: {
  nav: NavItem[];
  title: string;
  role: UserRole;
  children: ReactNode;
  showInsights?: boolean;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar items={nav} title={title} role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardNavbar role={role} />
        <div className="flex flex-1">
          <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:py-8 lg:pb-8">{children}</main>
          {showInsights && role === "patient" && <HealthInsightsPanel />}
        </div>
      </div>
      <MobileBottomNav role={role} />
    </div>
  );
}
