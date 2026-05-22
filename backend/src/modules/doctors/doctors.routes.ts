import { Router } from "express";
import * as doctorsController from "./doctors.controller.js";

export const doctorsRoutes = Router();

doctorsRoutes.get("/", doctorsController.list);
doctorsRoutes.get("/:id/slots", doctorsController.slots);
