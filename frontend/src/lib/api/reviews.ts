import { apiClient } from "./client";

export type ConsultationReview = {
  id: string;
  appointmentId?: string;
  rating: number;
  comment?: string;
  doctorName?: string;
  specialty?: string;
  createdAt: string;
};

export async function submitConsultationReview(body: {
  appointmentId: string;
  rating: number;
  comment?: string;
}) {
  const { data } = await apiClient.post<{ review: ConsultationReview }>("/reviews", body);
  return data.review;
}

export async function fetchAppointmentReview(appointmentId: string) {
  const { data } = await apiClient.get<{ review: ConsultationReview | null }>(
    `/reviews/appointment/${appointmentId}`,
  );
  return data.review;
}

export async function fetchMyReviews() {
  const { data } = await apiClient.get<{ reviews: ConsultationReview[] }>("/reviews");
  return data.reviews;
}
