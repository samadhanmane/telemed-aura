import { Router } from "express";
import { authRoutes } from "../../modules/auth/auth.routes.js";
import { doctorsRoutes } from "../../modules/doctors/doctors.routes.js";
import { appointmentRoutes } from "../../modules/appointments/appointments.routes.js";
import { videoRoutes } from "../../modules/video/video.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/doctors", doctorsRoutes);
apiRouter.use("/appointments", appointmentRoutes);
apiRouter.use("/video", videoRoutes);
