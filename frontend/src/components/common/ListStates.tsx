import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoadingList({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyList({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground",
        className,
      )}
    >
      <Inbox className="h-10 w-10 opacity-50" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-xs">{description}</p> : null}
    </div>
  );
}

export function ErrorList({
  title = "Unable to load data",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className,
      )}
    >
      <AlertCircle className="h-10 w-10 text-destructive/80" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function DoctorCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border p-4">
      <div className="flex gap-3">
        <div className="h-14 w-14 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
