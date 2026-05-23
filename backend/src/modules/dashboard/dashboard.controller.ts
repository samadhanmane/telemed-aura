import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as dashboardService from "./dashboard.service.js";

export async function patientHome(req: AuthRequest, res: Response) {
  const data = await dashboardService.getPatientDashboard(req.user!.userId);
  return res.json(data);
}

export async function patientTimeline(req: AuthRequest, res: Response) {
  const timeline = await dashboardService.getPatientTimeline(req.user!.userId);
  return res.json({ timeline });
}

export async function patientAnalytics(req: AuthRequest, res: Response) {
  const analytics = await dashboardService.getPatientAnalytics(req.user!.userId);
  return res.json({ analytics });
}

export async function listDoctorPatients(req: AuthRequest, res: Response) {
  const patients = await dashboardService.listDoctorPatients(req.user!.userId);
  return res.json({ patients });
}

export async function doctorHome(req: AuthRequest, res: Response) {
  const data = await dashboardService.getDoctorDashboard(req.user!.userId);
  return res.json(data);
}

export async function doctorPatient(req: AuthRequest, res: Response) {
  try {
    const data = await dashboardService.getDoctorPatientDetail(
      req.user!.userId,
      String(req.params.patientId),
    );
    return res.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Not found";
    return res.status(404).json({ error: msg });
  }
}

export async function doctorAnalytics(req: AuthRequest, res: Response) {
  const data = await dashboardService.getDoctorAnalytics(req.user!.userId);
  return res.json({ analytics: data });
}

export async function adminHome(req: AuthRequest, res: Response) {
  const data = await dashboardService.getAdminDashboard();
  return res.json(data);
}

export async function adminUsers(req: AuthRequest, res: Response) {
  const users = await dashboardService.listAdminUsers();
  return res.json({ users });
}

export async function adminDoctors(req: AuthRequest, res: Response) {
  const status = req.query.status as "pending" | "approved" | "rejected" | "all" | undefined;
  const doctors = await dashboardService.listAdminDoctors(status ?? "all");
  return res.json({ doctors });
}

export async function approveDoctor(req: AuthRequest, res: Response) {
  try {
    const result = await dashboardService.approveDoctorRegistration(String(req.params.doctorId));
    return res.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Approval failed";
    return res.status(400).json({ error: msg });
  }
}

export async function rejectDoctor(req: AuthRequest, res: Response) {
  try {
    const { reason } = req.body;
    const result = await dashboardService.rejectDoctorRegistration(
      String(req.params.doctorId),
      reason,
    );
    return res.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Rejection failed";
    return res.status(400).json({ error: msg });
  }
}

export async function adminPatients(req: AuthRequest, res: Response) {
  const patients = await dashboardService.listAdminPatients();
  return res.json({ patients });
}

export async function adminAiMonitoring(req: AuthRequest, res: Response) {
  const data = await dashboardService.getAdminAiMonitoring();
  return res.json(data);
}
