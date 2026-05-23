import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";
import * as filesController from "./files.controller.js";

export const filesRoutes = Router();

filesRoutes.get("/download", requireAuth, filesController.downloadFile);
