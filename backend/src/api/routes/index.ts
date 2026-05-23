import { Router } from "express";
import { authRoutes } from "../../modules/auth/auth.routes.js";
import { doctorsRoutes } from "../../modules/doctors/doctors.routes.js";
import { appointmentRoutes } from "../../modules/appointments/appointments.routes.js";
import { videoRoutes } from "../../modules/video/video.routes.js";
import { clinicalRoutes } from "../../modules/clinical/clinical.routes.js";
import { dashboardRoutes } from "../../modules/dashboard/dashboard.routes.js";
import { aiRoutes } from "../../modules/ai/ai.routes.js";
import { notificationsRoutes } from "../../modules/notifications/notifications.routes.js";
import { emrRoutes } from "../../modules/emr/emr.routes.js";
import { reviewsRoutes } from "../../modules/reviews/reviews.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/doctors", doctorsRoutes);
apiRouter.use("/appointments", appointmentRoutes);
apiRouter.use("/clinical", clinicalRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/ai", aiRoutes);
apiRouter.use("/notifications", notificationsRoutes);
apiRouter.use("/emr", emrRoutes);
apiRouter.use("/video", videoRoutes);
apiRouter.use("/reviews", reviewsRoutes);
