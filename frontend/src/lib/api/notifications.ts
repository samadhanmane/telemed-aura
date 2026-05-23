import { apiClient } from "./client";

export type ApiNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
};

export async function fetchNotifications() {
  const { data } = await apiClient.get<{ notifications: ApiNotification[] }>("/notifications");
  return data.notifications;
}

export async function markNotificationRead(id: string) {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await apiClient.patch("/notifications/read-all");
}
