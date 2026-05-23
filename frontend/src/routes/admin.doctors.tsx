import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Check, X } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  approveDoctorRegistration,
  fetchAdminDoctors,
  rejectDoctorRegistration,
  type AdminDoctorRow,
} from "@/lib/api/dashboard";
import { resolveUploadUrl } from "@/lib/api/upload-url";
import { DownloadFileButton } from "@/components/files/DownloadFileButton";

export const Route = createFileRoute("/admin/doctors")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Doctors — Admin" }] }),
  component: AdminDoctors,
});

function DoctorCard({
  d,
  onApprove,
  onReject,
  showActions,
}: {
  d: AdminDoctorRow;
  onApprove: () => void;
  onReject: () => void;
  showActions: boolean;
}) {
  const certUrl = resolveUploadUrl(d.certificateUrl);

  return (
    <Card className="rounded-2xl p-5 shadow-soft">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="font-semibold">{d.name}</p>
          <p className="text-xs text-muted-foreground">
            {d.specialty} · License {d.licenseNumber} · {d.experienceYears} yrs
          </p>
          <p className="text-xs text-muted-foreground">{d.email}</p>
          {d.phone && <p className="text-xs text-muted-foreground">{d.phone}</p>}
        </div>
        <Badge
          variant={
            d.verificationStatus === "approved"
              ? "default"
              : d.verificationStatus === "pending"
                ? "secondary"
                : "destructive"
          }
        >
          {d.verificationStatus === "approved"
            ? "Live"
            : d.verificationStatus === "pending"
              ? "Pending review"
              : "Rejected"}
        </Badge>
      </div>
      {d.bio && <p className="mt-3 text-xs text-muted-foreground line-clamp-3">{d.bio}</p>}
      {certUrl && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={certUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View certificate
          </a>
          <DownloadFileButton
            fileUrl={d.certificateUrl}
            fileName={`${d.name}-certificate`}
            label="Download"
            variant="link"
            className="h-auto p-0 text-xs"
          />
        </div>
      )}
      {d.submittedAt && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Submitted {new Date(d.submittedAt).toLocaleString()}
        </p>
      )}
      {showActions && d.verificationStatus === "pending" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" className="bg-success text-success-foreground" onClick={onApprove}>
            <Check className="mr-1 h-4 w-4" />
            Approve & go live
          </Button>
          <Button size="sm" variant="destructive" onClick={onReject}>
            <X className="mr-1 h-4 w-4" />
            Reject
          </Button>
        </div>
      )}
      {d.verificationStatus === "approved" && (
        <p className="mt-3 text-xs text-muted-foreground">★ {d.rating} · visible to patients</p>
      )}
    </Card>
  );
}

function AdminDoctors() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "all">("pending");
  const [rejectTarget, setRejectTarget] = useState<AdminDoctorRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["admin-doctors", tab],
    queryFn: () => fetchAdminDoctors(tab === "all" ? "all" : tab),
  });

  const approveMutation = useMutation({
    mutationFn: approveDoctorRegistration,
    onSuccess: () => {
      toast.success("Doctor approved — now live on the website");
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: () => toast.error("Approval failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectDoctorRegistration(id, reason),
    onSuccess: () => {
      toast.success("Registration rejected — doctor must register again");
      setRejectTarget(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: () => toast.error("Rejection failed"),
  });

  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <PageHeader
        title="Doctor verification"
        description="Review certificates, approve doctors to appear on the patient portal, or reject and require re-registration."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Live doctors</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {doctors.map((d) => (
              <DoctorCard
                key={d.id}
                d={d}
                showActions={tab === "pending" || tab === "all"}
                onApprove={() => approveMutation.mutate(d.id)}
                onReject={() => setRejectTarget(d)}
              />
            ))}
          </div>
          {!isLoading && doctors.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              {tab === "pending" ? "No applications awaiting review." : "No doctors in this list."}
            </p>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectTarget?.name}?</DialogTitle>
            <DialogDescription>
              The account will be removed. They must register again with a new certificate to apply.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Optional reason (shown only in your records)…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() =>
                rejectTarget && rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })
              }
            >
              Reject registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
