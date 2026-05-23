import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Loader2,
  Shield,
  LogIn,
  PanelRightOpen,
  PanelRightClose,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useVideoCall } from "../hooks/useVideoCall";
import { LocalConsultVideo, RemoteConsultVideo } from "./ConsultVideo";
import { DoctorConsultPanel } from "./DoctorConsultPanel";
import { ConnectionQualityBar } from "./ConnectionQualityBar";
import { fetchAppointment } from "@/lib/api/clinical";
import { toast } from "sonner";

export function DoctorConsultRoom({
  appointmentId,
  exitTo,
}: {
  appointmentId: string;
  exitTo: string;
}) {
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("Patient");
  const [conclusion, setConclusion] = useState("");
  const [endVitals, setEndVitals] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    sugarLevel: "",
    oxygenLevel: "",
  });

  const {
    localRef,
    remoteRef,
    status,
    error,
    audioOn,
    videoOn,
    peerAudioOn,
    peerVideoOn,
    appointmentInfo,
    turnEnabled,
    connectionHint,
    qualityTier,
    audioOnlyFallback,
    adaptiveMessage,
    networkStats,
    downgradeCount,
    ruralOptimized,
    joinCall,
    endCall,
    toggleAudio,
    toggleVideo,
    switchToAudioOnly,
    tryRestoreVideo,
    setScheduledFollowUp,
  } = useVideoCall(appointmentId, "doctor");

  useEffect(() => {
    fetchAppointment(appointmentId)
      .then((a) => {
        setPatientId(a.patientId);
        setPatientName(a.patientName ?? "Patient");
      })
      .catch(() => toast.error("Could not load appointment"));
  }, [appointmentId]);

  useEffect(() => {
    if (appointmentInfo?.patientName) setPatientName(appointmentInfo.patientName);
    if (appointmentInfo?.patientId) setPatientId(appointmentInfo.patientId);
  }, [appointmentInfo]);

  const inCall = status !== "idle" && status !== "ended" && status !== "error";

  const statusLabel =
    status === "idle"
      ? "Ready to join"
      : status === "joining"
        ? "Verifying session…"
        : status === "connecting"
          ? "Establishing secure connection…"
          : status === "waiting"
            ? "Waiting for patient…"
            : status === "live"
              ? "Secure consultation live"
              : status === "ended"
                ? "Call ended"
                : error;

  const handleEndCall = async () => {
    await endCall({
      conclusion: conclusion.trim() || undefined,
      vitals: {
        bloodPressureSystolic: endVitals.bloodPressureSystolic
          ? Number(endVitals.bloodPressureSystolic)
          : undefined,
        bloodPressureDiastolic: endVitals.bloodPressureDiastolic
          ? Number(endVitals.bloodPressureDiastolic)
          : undefined,
        sugarLevel: endVitals.sugarLevel ? Number(endVitals.sugarLevel) : undefined,
        oxygenLevel: endVitals.oxygenLevel ? Number(endVitals.oxygenLevel) : undefined,
      },
    });
    navigate({ to: exitTo });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold">Doctor consultation</span>
            </div>
            {appointmentInfo && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {appointmentInfo.patientName} · {appointmentInfo.specialization} ·{" "}
                {appointmentInfo.date} {appointmentInfo.time}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{statusLabel}</p>
            {inCall && (
              <div className="mt-2">
                <ConnectionQualityBar
                  tier={qualityTier}
                  audioOnlyFallback={audioOnlyFallback}
                  adaptiveMessage={adaptiveMessage}
                  networkStats={networkStats}
                  downgradeCount={downgradeCount}
                  ruralOptimized={ruralOptimized}
                  onSwitchAudioOnly={switchToAudioOnly}
                  onRestoreVideo={tryRestoreVideo}
                />
              </div>
            )}
            {inCall && turnEnabled === false && (
              <p className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                {connectionHint ?? "TURN relay not configured — rural NAT may block video."}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {patientId && (
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setPanelOpen((v) => !v)}
              >
                {panelOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
            )}
            {!inCall && (
              <Button variant="ghost" size="sm" asChild>
                <Link to={exitTo}>Back</Link>
              </Button>
            )}
          </div>
        </header>

        {status === "idle" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
            <Card className="max-w-md rounded-2xl p-8 text-center shadow-soft">
              <Shield className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">Join secure consultation</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Rural-optimized video: adaptive 240p–360p, auto audio fallback on weak networks.
              </p>
              <Button
                className="mt-6 w-full bg-gradient-primary text-primary-foreground"
                onClick={joinCall}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Join consultation
              </Button>
            </Card>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" asChild>
              <Link to={exitTo}>Go back</Link>
            </Button>
          </div>
        )}

        {inCall && (
          <>
            <div className="relative flex flex-1 flex-col p-4">
              <Card className="relative min-h-[40vh] flex-1 overflow-hidden rounded-2xl bg-muted lg:min-h-[50vh]">
                <RemoteConsultVideo videoRef={remoteRef} />
                {!peerVideoOn && status === "live" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">Patient camera off</p>
                  </div>
                )}
                {(status === "connecting" || status === "waiting" || status === "joining") && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/90">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{statusLabel}</p>
                  </div>
                )}
                {status === "live" && !peerAudioOn && (
                  <div className="absolute left-4 top-4">
                    <Badge variant="secondary" className="gap-1">
                      <MicOff className="h-3 w-3" /> Patient muted
                    </Badge>
                  </div>
                )}
              </Card>
              <Card className="absolute bottom-28 right-6 z-10 h-28 w-24 overflow-hidden rounded-xl border-2 border-primary shadow-lg md:bottom-8">
                <LocalConsultVideo videoRef={localRef} visible={videoOn} />
                {!videoOn && (
                  <div className="flex h-full items-center justify-center bg-muted text-[10px] text-muted-foreground">
                    Camera off
                  </div>
                )}
              </Card>
            </div>

            <div className="flex items-center justify-center gap-4 border-t py-4">
              <Button
                size="lg"
                variant={audioOn ? "outline" : "secondary"}
                className="rounded-full"
                onClick={toggleAudio}
              >
                {audioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              <Button
                size="lg"
                variant={videoOn ? "outline" : "secondary"}
                className="rounded-full"
                onClick={toggleVideo}
              >
                {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" variant="destructive" className="rounded-full px-8">
                    <PhoneOff className="mr-2 h-5 w-5" />
                    End call
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End consultation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Consultation conclusion and vitals are saved to the patient EMR immediately.
                    </AlertDialogDescription>
                    <div className="space-y-3 py-2 text-left">
                      <div>
                        <Label>Consultation conclusion</Label>
                        <Textarea
                          placeholder="Diagnosis summary, advice, follow-up plan…"
                          value={conclusion}
                          onChange={(e) => setConclusion(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">BP sys</Label>
                          <Input
                            type="number"
                            value={endVitals.bloodPressureSystolic}
                            onChange={(e) =>
                              setEndVitals((v) => ({ ...v, bloodPressureSystolic: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">BP dia</Label>
                          <Input
                            type="number"
                            value={endVitals.bloodPressureDiastolic}
                            onChange={(e) =>
                              setEndVitals((v) => ({ ...v, bloodPressureDiastolic: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Sugar</Label>
                          <Input
                            type="number"
                            value={endVitals.sugarLevel}
                            onChange={(e) => setEndVitals((v) => ({ ...v, sugarLevel: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">SpO₂</Label>
                          <Input
                            type="number"
                            value={endVitals.oxygenLevel}
                            onChange={(e) => setEndVitals((v) => ({ ...v, oxygenLevel: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Stay in call</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEndCall}>End call</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}

        {status === "ended" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <p className="text-sm text-muted-foreground">Consultation ended. Remarks are saved to the patient chart.</p>
            <Button asChild>
              <Link to={exitTo}>Return to appointments</Link>
            </Button>
          </div>
        )}
      </div>

      {patientId && panelOpen && (
        <aside className="w-full shrink-0 border-t lg:w-[min(100%,480px)] lg:max-w-[480px] lg:border-l lg:border-t-0">
          <div className="h-[min(70vh,640px)] p-3 lg:h-full lg:max-h-screen lg:p-4">
            <DoctorConsultPanel
              patientId={patientId}
              appointmentId={appointmentId}
              patientName={patientName}
              onFollowUpScheduled={setScheduledFollowUp}
            />
          </div>
        </aside>
      )}
    </div>
  );
}
