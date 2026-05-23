import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import { Notification } from "../../database/models/index.js";

export async function list(req: AuthRequest, res: Response) {
  const notifications = await Notification.find({ userId: req.user!.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return res.json({
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
}

export async function markRead(req: AuthRequest, res: Response) {
  await Notification.updateOne(
    { _id: req.params.id, userId: req.user!.userId },
    { read: true },
  );
  return res.json({ ok: true });
}

export async function markAllRead(req: AuthRequest, res: Response) {
  await Notification.updateMany({ userId: req.user!.userId }, { read: true });
  return res.json({ ok: true });
}

function formatTimeAgo(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
