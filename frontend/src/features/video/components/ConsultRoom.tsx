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

export function ConsultRoom({
  appointmentId,
  role,
  exitTo,
}: {
  appointmentId: string;
  role: "patient" | "doctor";
  exitTo: string;
}) {
  const navigate = useNavigate();
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
    joinCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useVideoCall(appointmentId, role);

  const inCall = status !== "idle" && status !== "ended" && status !== "error";

  const statusLabel =
    status === "idle"
      ? "Ready to join"
      : status === "joining"
        ? "Verifying session…"
        : status === "connecting"
          ? "Establishing secure connection…"
          : status === "waiting"
            ? `Waiting for ${role === "patient" ? "doctor" : "patient"}…`
            : status === "live"
              ? "Secure consultation live"
              : status === "ended"
                ? "Call ended"
                : error;

  const handleEndCall = async () => {
    await endCall();
    navigate({ to: exitTo });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
        </div>
        {!inCall && (
          <Button variant="ghost" size="sm" asChild>
            <Link to={exitTo}>Back</Link>
          </Button>
        )}
      </header>

      {status === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
          <Card className="max-w-md rounded-2xl p-8 text-center shadow-soft">
            <Shield className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">Join secure consultation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Only you and your {role === "patient" ? "doctor" : "patient"} can enter this
              encrypted session. Camera and microphone will be requested.
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
            <Card className="relative min-h-[50vh] flex-1 overflow-hidden rounded-2xl bg-muted">
              <RemoteConsultVideo videoRef={remoteRef} />
              {!peerVideoOn && status === "live" && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <p className="text-sm text-muted-foreground">Camera off</p>
                </div>
              )}
              {(status === "connecting" || status === "waiting" || status === "joining") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/90">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{statusLabel}</p>
                </div>
              )}
              {status === "live" && (
                <div className="absolute left-4 top-4 flex gap-2">
                  {!peerAudioOn && (
                    <Badge variant="secondary" className="gap-1">
                      <MicOff className="h-3 w-3" /> Muted
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
              aria-label={audioOn ? "Mute microphone" : "Unmute microphone"}
            >
              {audioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              size="lg"
              variant={videoOn ? "outline" : "secondary"}
              className="rounded-full"
              onClick={toggleVideo}
              aria-label={videoOn ? "Turn off camera" : "Turn on camera"}
            >
              {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full px-8"
                  aria-label="End call"
                >
                  <PhoneOff className="mr-2 h-5 w-5" />
                  End call
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End consultation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will disconnect the video call and mark the session as completed.
                  </AlertDialogDescription>
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
          <p className="text-sm text-muted-foreground">Consultation ended securely.</p>
          <Button asChild>
            <Link to={exitTo}>Return to appointments</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
