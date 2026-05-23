import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import { Notification } from "../../database/models/index.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { notFound } from "../../shared/errors/app-error.js";

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ userId: req.user!.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return sendSuccess(res, "Notifications loaded", {
    notifications: notifications.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      time: formatTimeAgo(n.createdAt),
      createdAt: n.createdAt,
    })),
  });
});

export const markRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await Notification.updateOne(
    { _id: req.params.id, userId: req.user!.userId },
    { read: true },
  );
  if (result.matchedCount === 0) throw notFound("Notification not found");
  return sendSuccess(res, "Notification marked as read", { ok: true });
});

export const markAllRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ userId: req.user!.userId }, { read: true });
  return sendSuccess(res, "All notifications marked as read", { ok: true });
});

function formatTimeAgo(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
