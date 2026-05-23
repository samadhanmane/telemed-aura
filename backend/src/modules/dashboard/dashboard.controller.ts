import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as dashboardService from "./dashboard.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";

export const patientHome = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await dashboardService.getPatientDashboard(req.user!.userId);
  return sendSuccess(res, "Dashboard loaded", data);
});

export const patientTimeline = asyncHandler(async (req: AuthRequest, res: Response) => {
  const timeline = await dashboardService.getPatientTimeline(req.user!.userId);
  return sendSuccess(res, "Timeline loaded", { timeline });
});

export const patientAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const analytics = await dashboardService.getPatientAnalytics(req.user!.userId);
  return sendSuccess(res, "Analytics loaded", { analytics });
});

export const listDoctorPatients = asyncHandler(async (req: AuthRequest, res: Response) => {
  const patients = await dashboardService.listDoctorPatients(req.user!.userId);
  return sendSuccess(res, "Patients loaded", { patients });
});

export const doctorHome = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await dashboardService.getDoctorDashboard(req.user!.userId);
  return sendSuccess(res, "Dashboard loaded", data);
});

export const doctorPatient = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await dashboardService.getDoctorPatientDetail(
    req.user!.userId,
    String(req.params.patientId),
  );
  return sendSuccess(res, "Patient loaded", data);
});

export const doctorAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await dashboardService.getDoctorAnalytics(req.user!.userId);
  return sendSuccess(res, "Analytics loaded", { analytics: data });
});

export const adminHome = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await dashboardService.getAdminDashboard();
  return sendSuccess(res, "Admin dashboard loaded", data);
});

export const adminUsers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const users = await dashboardService.listAdminUsers();
  return sendSuccess(res, "Users loaded", { users });
});

export const adminDoctors = asyncHandler(async (req: AuthRequest, res: Response) => {
  const status = req.query.status as "pending" | "approved" | "rejected" | "all" | undefined;
  const doctors = await dashboardService.listAdminDoctors(status ?? "all");
  return sendSuccess(res, "Doctors loaded", { doctors });
});

export const approveDoctor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await dashboardService.approveDoctorRegistration(String(req.params.doctorId));
  return sendSuccess(res, "Doctor approved successfully", result);
});

export const rejectDoctor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const result = await dashboardService.rejectDoctorRegistration(
    String(req.params.doctorId),
    reason,
  );
  return sendSuccess(res, "Doctor registration rejected", result);
});

export const adminPatients = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const patients = await dashboardService.listAdminPatients();
  return sendSuccess(res, "Patients loaded", { patients });
});

export const adminAiMonitoring = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await dashboardService.getAdminAiMonitoring();
  return sendSuccess(res, "AI monitoring loaded", data);
});
