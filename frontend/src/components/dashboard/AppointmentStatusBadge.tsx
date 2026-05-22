import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/types/healthcare";
import { cn } from "@/lib/utils";

const labels: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const styles: Record<AppointmentStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-success text-success-foreground",
  in_progress: "bg-primary text-primary-foreground",
  completed: "bg-accent/20 text-accent-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge className={cn("capitalize", styles[status])}>{labels[status]}</Badge>
  );
}
