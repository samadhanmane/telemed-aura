import { Router } from "express";
import * as notificationsController from "./notifications.controller.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

export const notificationsRoutes = Router();

notificationsRoutes.use(requireAuth);
notificationsRoutes.get("/", notificationsController.list);
notificationsRoutes.patch("/read-all", notificationsController.markAllRead);
notificationsRoutes.patch("/:id/read", notificationsController.markRead);
