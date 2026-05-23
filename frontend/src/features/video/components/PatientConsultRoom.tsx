import { useEffect, useState } from "react";
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
import { PatientConsultPanel } from "./PatientConsultPanel";
import { ConnectionQualityBar } from "./ConnectionQualityBar";
import { LocalConsultVideo, RemoteConsultVideo } from "./ConsultVideo";
import { fetchAppointment } from "@/lib/api/clinical";
import { toast } from "sonner";

export function PatientConsultRoom({
  appointmentId,
  exitTo,
}: {
  appointmentId: string;
  exitTo: string;
}) {
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(true);
  const [doctorName, setDoctorName] = useState("Doctor");
  const [specialization, setSpecialization] = useState("");

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
    leaveCall,
    toggleAudio,
    toggleVideo,
    switchToAudioOnly,
    tryRestoreVideo,
    scheduledFollowUp,
  } = useVideoCall(appointmentId, "patient");

  useEffect(() => {
    fetchAppointment(appointmentId)
      .then((a) => {
        setDoctorName(a.doctorName ?? "Doctor");
        setSpecialization(a.specialization ?? "");
      })
      .catch(() => toast.error("Could not load appointment"));
  }, [appointmentId]);

  useEffect(() => {
    if (appointmentInfo?.doctorName) setDoctorName(appointmentInfo.doctorName);
    if (appointmentInfo?.specialization) setSpecialization(appointmentInfo.specialization);
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
            ? "Waiting for doctor…"
            : status === "live"
              ? "Secure consultation live"
              : status === "ended"
                ? "Consultation completed"
                : error;

  const handleLeaveCall = async () => {
    await leaveCall();
    navigate({ to: exitTo });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold">Secure video consultation</span>
            </div>
            {appointmentInfo && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {appointmentInfo.specialization} · {appointmentInfo.date} {appointmentInfo.time}
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
                {connectionHint ?? "TURN relay not configured — connection may fail behind strict NAT."}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {inCall && (
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setPanelOpen((o) => !o)}
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
                Optimized for rural networks. You can leave and rejoin anytime until your doctor
                marks this visit completed on their appointments page.
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
                    <Mic className="h-10 w-10 text-primary" />
                    <p className="text-sm text-muted-foreground">Doctor on audio / camera off</p>
                  </div>
                )}
                {(status === "connecting" || status === "waiting" || status === "joining") && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/90">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{statusLabel}</p>
                    {status === "waiting" && (
                      <p className="max-w-xs text-center text-xs text-muted-foreground">
                        Your camera preview is in the corner. The doctor must join the same
                        appointment from their dashboard to start the call.
                      </p>
                    )}
                  </div>
                )}
                {status === "live" && (
                  <div className="absolute left-4 top-4 flex gap-2">
                    {!peerAudioOn && (
                      <Badge variant="secondary" className="gap-1">
                        <MicOff className="h-3 w-3" /> Doctor muted
                      </Badge>
                    )}
                  </div>
                )}
              </Card>

              <Card className="absolute bottom-28 right-6 z-10 h-36 w-28 overflow-hidden rounded-xl border-2 border-primary shadow-lg md:bottom-8">
                <LocalConsultVideo videoRef={localRef} visible={videoOn} />
                {!videoOn && (
                  <div className="flex h-full items-center justify-center bg-muted text-xs text-muted-foreground">
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
                    Leave call
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave video call?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The visit is still in progress. You can return and rejoin until your doctor
                      marks the appointment completed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Stay in call</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLeaveCall}>Leave call</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}

        {status === "ended" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <p className="text-sm text-muted-foreground">
              Your doctor marked this consultation completed. Your visit summary is in your health
              record.
            </p>
            <Button asChild>
              <Link to="/patient/emr">View health record</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={exitTo}>Return to appointments</Link>
            </Button>
          </div>
        )}
      </div>

      {panelOpen && (
        <aside className="w-full shrink-0 border-t lg:w-[380px] lg:border-l lg:border-t-0">
          <div className="h-[min(70vh,640px)] p-3 lg:h-full lg:max-h-screen lg:p-4">
            <PatientConsultPanel
              appointmentId={appointmentId}
              doctorName={doctorName}
              specialization={specialization}
              scheduledFollowUp={scheduledFollowUp}
            />
          </div>
        </aside>
      )}
    </div>
  );
}
