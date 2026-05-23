import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  FileHeart,
  Loader2,
  Phone,
  RefreshCw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  acceptCriticalPatient,
  fetchCriticalBoard,
  fetchDoctorTriageQueue,
  fetchNextFreeSlot,
  rescheduleConsult,
  type AcceptCriticalResult,
  type CriticalBoardPatient,
  type PatientSeverity,
  type TriageQueueItem,
} from "@/lib/api/triage";
import { fetchDoctorSlots } from "@/lib/api/doctors";
import { getApiErrorMessage } from "@/lib/api/client";
import { getTodayDateString } from "@/lib/appointment-slots";
import { useAuthStore } from "@/stores/auth-store";
import { AppointmentStatusBadge } from "@/components/dashboard/AppointmentStatusBadge";
import type { AppointmentStatus } from "@/types/healthcare";

function SeverityBadge({ s }: { s: PatientSeverity }) {
  const variant =
    s.severity === "Critical" || s.emergency
      ? "destructive"
      : s.severity === "High"
        ? "destructive"
        : s.severity === "Moderate"
          ? "secondary"
          : "outline";
  return (
    <Badge variant={variant} className="text-[10px]">
      {s.emergency ? "Emergency · " : ""}
      {s.severity} · {s.riskScore}%
    </Badge>
  );
}

function ConflictRescheduleDialog({
  result,
  open,
  onOpenChange,
  onDone,
}: {
  result: AcceptCriticalResult | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const rescheduleOne = useMutation({
    mutationFn: (appointmentId: string) =>
      rescheduleConsult({
        appointmentId,
        autoNextSlot: true,
        reason: "Rescheduled — critical patient accepted within 30 minutes",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["triage-queue"] });
      qc.invalidateQueries({ queryKey: ["critical-board"] });
      toast.success("Appointment moved to next free slot");
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Reschedule failed")),
  });

  if (!result?.mustRescheduleFirst) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reschedule conflicting visits first</AlertDialogTitle>
          <AlertDialogDescription>
            The critical patient is booked for {result.appointment.date} at{" "}
            {result.appointment.time}. You have other appointments within 30 minutes — move them
            before joining the urgent call.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="space-y-2 text-sm">
          {result.conflictsWithin30Min.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg border p-2">
              <span>
                {c.date} {c.time} ({c.status})
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={rescheduleOne.isPending}
                onClick={() => rescheduleOne.mutate(c.id)}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Move to next slot
              </Button>
            </li>
          ))}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel>Later</AlertDialogCancel>
          <AlertDialogAction onClick={onDone}>Done</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AcceptImmediateForm({
  patientId,
  patientName,
  onDone,
}: {
  patientId: string;
  patientName: string;
  onDone: (result: AcceptCriticalResult) => void;
}) {
  const doctorId = useAuthStore((s) => s.user?.id);
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState("");

  const { data: slots = [] } = useQuery({
    queryKey: ["doctor-slots", doctorId, date, "critical"],
    queryFn: () => fetchDoctorSlots(doctorId!, date),
    enabled: !!doctorId && !!date,
  });

  const accept = useMutation({
    mutationFn: () => acceptCriticalPatient({ patientId, date, time }),
    onSuccess: (result) => {
      toast.success(`Critical case accepted — ${patientName}`);
      onDone(result);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Could not accept — another doctor may have taken this case")),
  });

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-xs font-medium">
        Accept immediate call — {patientName} (exclusive; other doctors blocked)
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px]">Date</Label>
          <Input
            type="date"
            className="h-8 text-xs"
            min={getTodayDateString()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-[10px]">Free slot</Label>
          <select
            className="flex h-8 w-full rounded-md border px-2 text-xs"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          >
            <option value="">Select…</option>
            {slots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button
        size="sm"
        className="w-full"
        disabled={!time || accept.isPending}
        onClick={() => accept.mutate()}
      >
        <Phone className="mr-1 h-3 w-3" />
        Accept immediate call
      </Button>
    </div>
  );
}

function QueueRow({ item, onRefresh }: { item: TriageQueueItem; onRefresh: () => void }) {
  const reschedule = useMutation({
    mutationFn: () =>
      rescheduleConsult({
        appointmentId: item.appointment.id,
        autoNextSlot: true,
        reason: "Rescheduled by doctor (triage)",
      }),
    onSuccess: () => {
      toast.success("Moved to next free slot");
      onRefresh();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Reschedule failed")),
  });

  return (
    <li className="rounded-xl border border-border/60 p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{item.appointment.patientName}</p>
          <p className="text-xs text-muted-foreground">
            {item.appointment.date} · {item.appointment.time} · {item.appointment.specialization}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <SeverityBadge s={item.severity} />
          <AppointmentStatusBadge status={item.appointment.status as AppointmentStatus} />
          {item.appointment.priority === "urgent" && (
            <Badge variant="destructive" className="text-[10px]">
              Urgent
            </Badge>
          )}
        </div>
      </div>
      {item.severity.reasons[0] && (
        <p className="mt-2 text-[10px] text-muted-foreground line-clamp-2">{item.severity.reasons[0]}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
          <Link to="/doctor/patients/$patientId/emr" params={{ patientId: item.appointment.patientId }}>
            <FileHeart className="mr-1 h-3 w-3" /> EMR
          </Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={reschedule.isPending}
          onClick={() => reschedule.mutate()}
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Move to next slot
        </Button>
        {(item.appointment.status === "confirmed" || item.appointment.status === "in_progress") && (
          <Button size="sm" className="h-7 text-xs" asChild>
            <Link to="/doctor/consult/$appointmentId" params={{ appointmentId: item.appointment.id }}>
              Join call
            </Link>
          </Button>
        )}
      </div>
    </li>
  );
}

function CriticalRow({
  row,
  onRefresh,
}: {
  row: CriticalBoardPatient;
  onRefresh: () => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [conflictResult, setConflictResult] = useState<AcceptCriticalResult | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);

  return (
    <li className="rounded-xl border p-3 text-sm">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="font-medium">{row.severity.patientName}</p>
          {row.isAssignedToMe && (
            <Badge variant="destructive" className="mt-1 text-[10px]">
              Assigned to you
            </Badge>
          )}
          {row.isMyPatient && !row.isAssignedToMe && (
            <Badge variant="outline" className="mt-1 text-[10px]">
              Your patient
            </Badge>
          )}
          {!row.isMyPatient && !row.canAccept && row.claimedByDoctorName && (
            <p className="mt-1 text-xs text-muted-foreground">
              Accepted by Dr. {row.claimedByDoctorName}
            </p>
          )}
          {row.upcomingWithMe && (
            <p className="mt-1 text-xs text-muted-foreground">
              Visit: {row.upcomingWithMe.date} {row.upcomingWithMe.time}
            </p>
          )}
        </div>
        <SeverityBadge s={row.severity} />
      </div>
      <ul className="mt-2 list-inside list-disc text-[10px] text-muted-foreground">
        {row.severity.reasons.slice(0, 2).map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
          <Link
            to="/doctor/patients/$patientId/emr"
            params={{ patientId: row.severity.patientId }}
          >
            <FileHeart className="mr-1 h-3 w-3" /> EMR
          </Link>
        </Button>
        {row.canAccept && (
          <Button
            size="sm"
            className="h-7 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => setFormOpen((o) => !o)}
          >
            <Phone className="mr-1 h-3 w-3" />
            Accept immediate call
          </Button>
        )}
        {row.isAssignedToMe && row.appointmentId && (
          <Button size="sm" className="h-7 text-xs" asChild>
            <Link to="/doctor/consult/$appointmentId" params={{ appointmentId: row.appointmentId }}>
              Join when due
            </Link>
          </Button>
        )}
      </div>
      {formOpen && row.canAccept && (
        <AcceptImmediateForm
          patientId={row.severity.patientId}
          patientName={row.severity.patientName}
          onDone={(result) => {
            setFormOpen(false);
            setConflictResult(result);
            if (result.mustRescheduleFirst) setConflictOpen(true);
            onRefresh();
          }}
        />
      )}
      <ConflictRescheduleDialog
        result={conflictResult}
        open={conflictOpen}
        onOpenChange={setConflictOpen}
        onDone={() => {
          setConflictOpen(false);
          onRefresh();
        }}
      />
    </li>
  );
}

export function DoctorTriagePanel() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["triage-queue"] });
    qc.invalidateQueries({ queryKey: ["critical-board"] });
    qc.invalidateQueries({ queryKey: ["appointments"] });
  };

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ["triage-queue"],
    queryFn: fetchDoctorTriageQueue,
  });

  const { data: board, isLoading: criticalLoading } = useQuery({
    queryKey: ["critical-board"],
    queryFn: fetchCriticalBoard,
  });

  const fillNext = useMutation({
    mutationFn: () => fetchNextFreeSlot(),
    onSuccess: async (slot) => {
      if (!slot) {
        toast.error("No free slots in the next 2 weeks");
        return;
      }
      toast.message(`Next free: ${slot.date} at ${slot.time}`);
    },
  });

  const critical = board?.patients ?? [];

  return (
    <div className="space-y-6">
      {board?.assignedToday && (
        <Card className="rounded-2xl border-destructive/50 bg-destructive/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Critical patient booked for you today — needs urgent care
          </p>
          <p className="mt-1 text-sm font-medium">{board.assignedToday.severity.patientName}</p>
          <p className="text-xs text-muted-foreground">
            {board.assignedToday.appointment.date} at {board.assignedToday.appointment.time} ·{" "}
            {board.assignedToday.severity.severity} ({board.assignedToday.severity.riskScore}% risk)
          </p>
          <Button size="sm" className="mt-3" asChild>
            <Link
              to="/doctor/consult/$appointmentId"
              params={{ appointmentId: board.assignedToday.appointment.id }}
            >
              Open consult
            </Link>
          </Button>
        </Card>
      )}

      {queueData?.overloaded && (
        <Card className="rounded-2xl border-amber-500/40 bg-amber-500/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            High patient load ({queueData.totalUpcoming} upcoming)
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Non-critical bookings only — critical cases appear in the network board below.
          </p>
        </Card>
      )}

      <Card className="rounded-2xl p-4 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">Your patients (non-critical queue)</p>
          <Button variant="ghost" size="sm" onClick={() => fillNext.mutate()}>
            <Calendar className="mr-1 h-3 w-3" />
            Next free slot
          </Button>
        </div>
        {queueLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        {!queueLoading && (
          <ul className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {(queueData?.queue ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming non-critical appointments.</p>
            )}
            {(queueData?.queue ?? []).map((item) => (
              <QueueRow key={item.appointment.id} item={item} onRefresh={refresh} />
            ))}
          </ul>
        )}
      </Card>

      <Card className="rounded-2xl border-destructive/20 p-4 shadow-soft">
        <p className="font-semibold text-destructive">Critical patients (network-wide)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Open critical cases are visible to all doctors. The first doctor to accept gets exclusive
          access — others will not see that patient until the alert expires.
        </p>
        {criticalLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        <ul className="mt-4 space-y-3">
          {critical.map((row) => (
            <CriticalRow key={row.severity.patientId} row={row} onRefresh={refresh} />
          ))}
          {!criticalLoading && critical.length === 0 && (
            <p className="text-sm text-muted-foreground">No open critical alerts right now.</p>
          )}
        </ul>
      </Card>
    </div>
  );
}
