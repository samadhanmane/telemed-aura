import { useState } from "react";
import { Star } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchAppointmentReview, submitConsultationReview } from "@/lib/api/reviews";

export function RateConsultationDialog({
  appointmentId,
  doctorName,
}: {
  appointmentId: string;
  doctorName: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ["appointment-review", appointmentId],
    queryFn: () => fetchAppointmentReview(appointmentId),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () => submitConsultationReview({ appointmentId, rating, comment }),
    onSuccess: () => {
      toast.success("Thank you for your feedback");
      queryClient.invalidateQueries({ queryKey: ["appointment-review", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setOpen(false);
    },
    onError: (e: unknown) => {
      const msg = e && typeof e === "object" && "response" in e
        ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
        : null;
      toast.error(msg ?? "Could not submit review");
    },
  });

  if (existing) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        You rated this visit ★ {existing.rating}
        {existing.comment ? ` — "${existing.comment}"` : ""}
      </p>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="mt-2">
          Rate consultation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Dr. {doctorName}</DialogTitle>
          <DialogDescription>
            Your rating updates the doctor&apos;s profile for other patients.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-1 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="rounded p-1 hover:bg-muted"
              onClick={() => setRating(n)}
              aria-label={`${n} stars`}
            >
              <Star
                className={`h-8 w-8 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`}
              />
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Optional comment…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
        <Button
          className="bg-gradient-primary text-primary-foreground"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Submit review
        </Button>
      </DialogContent>
    </Dialog>
  );
}
