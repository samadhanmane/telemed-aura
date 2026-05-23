import { apiClient, extractResponseData } from "./client";

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
  const res = await apiClient.post("/reviews", body);
  const data = extractResponseData<{ review: ConsultationReview }>(res);
  return data.review;
}

export async function fetchAppointmentReview(appointmentId: string) {
  const res = await apiClient.get(`/reviews/appointment/${appointmentId}`);
  const data = extractResponseData<{ review: ConsultationReview | null }>(res);
  return data.review;
}

export async function fetchMyReviews() {
  const res = await apiClient.get("/reviews");
  const data = extractResponseData<{ reviews: ConsultationReview[] }>(res);
  return data.reviews;
}
