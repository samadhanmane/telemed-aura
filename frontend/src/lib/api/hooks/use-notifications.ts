import { useQuery } from "@tanstack/react-query";
import { useNotificationStore } from "@/stores/notification-store";

export function useNotifications() {
  const notifications = useNotificationStore((s) => s.notifications);
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 200));
      return notifications;
    },
    initialData: notifications,
  });
}
