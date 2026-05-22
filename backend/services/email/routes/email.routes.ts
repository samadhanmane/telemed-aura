import { Router } from "express";
import { emailController } from "../controllers/email.controller.js";

export const emailRouter = Router();

emailRouter.post("/send", emailController.send);
emailRouter.post("/appointment", emailController.appointment);
emailRouter.post("/prescription", emailController.prescription);
emailRouter.post("/video-invite", emailController.videoInvite);
emailRouter.post("/ai-alert", emailController.aiAlert);
