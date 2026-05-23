import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as clinicalService from "./clinical.service.js";
import * as appointmentsService from "../appointments/appointments.service.js";
import * as triageService from "./triage.service.js";
import * as criticalCareService from "./critical-care.service.js";
import { getTodayDateString } from "../../shared/appointment-slots.js";
import { getPatientSeveritySnapshot } from "./patient-severity.service.js";
import { getNextFreeSlot } from "../doctors/doctors.service.js";

export async function getPatientContext(req: AuthRequest, res: Response) {
  try {
    const ctx = await clinicalService.getPatientContext(
      req.user!.userId,
      String(req.params.patientId),
    );
    return res.json(ctx);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load patient";
    return res.status(400).json({ error: msg });
  }
}

export async function updateNote(req: AuthRequest, res: Response) {
  try {
    const { content, appointmentId } = req.body;
    if (content == null) return res.status(400).json({ error: "content required" });
    const note = await clinicalService.upsertClinicalNote(
      req.user!.userId,
      String(req.params.patientId),
      String(content),
      appointmentId,
    );
    return res.json({ note });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save note";
    return res.status(400).json({ error: msg });
  }
}

export async function createPrescription(req: AuthRequest, res: Response) {
  try {
    const { medicines, instructions, appointmentId } = req.body;
    if (!medicines?.length) return res.status(400).json({ error: "At least one medicine required" });
    const rx = await clinicalService.createPrescription(req.user!.userId, {
      patientId: String(req.params.patientId),
      appointmentId,
      medicines,
      instructions: instructions ?? "",
    });
    return res.status(201).json({ prescription: rx });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save prescription";
    return res.status(400).json({ error: msg });
  }
}

export async function scheduleFollowUp(req: AuthRequest, res: Response) {
  try {
    const { patientId, date, time, specialty, sourceAppointmentId } = req.body;
    if (!patientId || !date || !time) {
      return res.status(400).json({ error: "patientId, date, time required" });
    }
    const appointment = await appointmentsService.createFollowUpAppointment(req.user!.userId, {
      patientId,
      date,
      time,
      specialty,
      sourceAppointmentId,
    });

    if (sourceAppointmentId && typeof sourceAppointmentId === "string") {
      const { emitToAppointmentRoom } = await import("../../signaling/io.js");
      const { SIGNALING_EVENTS } = await import("../../signaling/events.js");
      emitToAppointmentRoom(sourceAppointmentId, SIGNALING_EVENTS.FOLLOW_UP_SCHEDULED, {
        appointment,
      });
    }

    return res.status(201).json({ appointment });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to schedule follow-up";
    return res.status(400).json({ error: msg });
  }
}

export async function uploadReport(req: AuthRequest, res: Response) {
  try {
    const file = req.file;
    if (file) {
      const name = (req.body.name as string) || file.originalname;
      const category = (req.body.category as string) || "General";
      if (!file.buffer) {
        return res.status(400).json({ error: "file upload failed" });
      }
      const result = await import("../ai/ai.service.js").then((m) =>
        m.uploadAndAnalyzeReport(req.user!.userId, {
          name,
          category,
          buffer: file.buffer,
          mimeType: file.mimetype,
          originalName: file.originalname,
        }),
      );
      return res.status(201).json(result);
    }

    return res.status(400).json({
      error: "Upload a file (PDF, PNG, or JPG) for full OCR, image detection, and AI analysis",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return res.status(400).json({ error: msg });
  }
}

export async function listDoctorReports(req: AuthRequest, res: Response) {
  try {
    const reports = await clinicalService.listDoctorPatientReports(req.user!.userId);
    return res.json({ reports });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load reports";
    return res.status(400).json({ error: msg });
  }
}

export async function listMyReports(req: AuthRequest, res: Response) {
  const reports = await clinicalService.listPatientReports(req.user!.userId);
  return res.json({ reports });
}

export async function listMyPrescriptions(req: AuthRequest, res: Response) {
  const prescriptions = await clinicalService.listPrescriptionsForPatient(req.user!.userId);
  return res.json({ prescriptions });
}

export async function reviewReport(req: AuthRequest, res: Response) {
  try {
    const { remarks, severityOverride, confirmedFlags } = req.body;
    if (!remarks?.trim()) return res.status(400).json({ error: "remarks required" });
    const report = await clinicalService.reviewMedicalReport(
      req.user!.userId,
      String(req.params.reportId),
      { remarks: String(remarks), severityOverride, confirmedFlags },
    );
    return res.json({ report });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Review failed";
    return res.status(400).json({ error: msg });
  }
}

export async function listDoctorPrescriptions(req: AuthRequest, res: Response) {
  const prescriptions = await clinicalService.listDoctorPrescriptions(req.user!.userId);
  return res.json({ prescriptions });
}

export async function getTriageQueue(req: AuthRequest, res: Response) {
  try {
    const data = await criticalCareService.listMyPatientsNonCriticalQueue(req.user!.userId);
    return res.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load triage queue";
    return res.status(400).json({ error: msg });
  }
}

export async function listCriticalPatients(req: AuthRequest, res: Response) {
  try {
    const data = await triageService.listPlatformCriticalPatients(req.user!.userId);
    return res.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load critical patients";
    return res.status(400).json({ error: msg });
  }
}

export async function getPatientSeverity(req: AuthRequest, res: Response) {
  try {
    const severity = await getPatientSeveritySnapshot(String(req.params.patientId));
    return res.json({ severity });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Patient not found";
    return res.status(400).json({ error: msg });
  }
}

export async function urgentBook(req: AuthRequest, res: Response) {
  try {
    const { patientId, date, time, specialty, rescheduleOtherAppointmentId } = req.body;
    if (!patientId || !date || !time) {
      return res.status(400).json({ error: "patientId, date, time required" });
    }
    const result = await criticalCareService.acceptCriticalImmediate(req.user!.userId, {
      patientId,
      date,
      time,
      specialty,
    });
    if (rescheduleOtherAppointmentId && result.mustRescheduleFirst) {
      await triageService.rescheduleAppointment(req.user!.userId, rescheduleOtherAppointmentId, {
        autoNextSlot: true,
        reason: "Rescheduled for critical patient acceptance",
      });
    }
    return res.status(201).json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Urgent booking failed";
    return res.status(400).json({ error: msg });
  }
}

export async function acceptCriticalPatient(req: AuthRequest, res: Response) {
  try {
    const { patientId, date, time, specialty } = req.body;
    if (!patientId || !date || !time) {
      return res.status(400).json({ error: "patientId, date, time required" });
    }
    const result = await criticalCareService.acceptCriticalImmediate(req.user!.userId, {
      patientId,
      date,
      time,
      specialty,
    });
    return res.status(201).json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not accept critical patient";
    return res.status(400).json({ error: msg });
  }
}

export async function getPatientCriticalAlert(req: AuthRequest, res: Response) {
  try {
    const alert = await criticalCareService.getActiveAlertForPatient(req.user!.userId);
    const slots =
      alert?.canPatientBook && req.query.doctorId
        ? await import("../doctors/doctors.service.js").then((m) =>
            m.getAvailableSlots(
              String(req.query.doctorId),
              String(req.query.date ?? getTodayDateString()),
            ),
          )
        : [];
    return res.json({ alert, slots });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return res.status(400).json({ error: msg });
  }
}

export async function dismissPatientCriticalAlert(req: AuthRequest, res: Response) {
  await criticalCareService.dismissCriticalNotification(req.user!.userId);
  return res.json({ ok: true });
}

export async function patientCriticalBook(req: AuthRequest, res: Response) {
  try {
    const { doctorId, date, time } = req.body;
    if (!doctorId || !date || !time) {
      return res.status(400).json({ error: "doctorId, date, time required" });
    }
    const result = await criticalCareService.patientBookCritical(req.user!.userId, {
      doctorId,
      date,
      time,
    });
    return res.status(201).json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Booking failed";
    return res.status(400).json({ error: msg });
  }
}

export async function rescheduleBooking(req: AuthRequest, res: Response) {
  try {
    const { appointmentId, date, time, autoNextSlot, reason } = req.body;
    if (!appointmentId) return res.status(400).json({ error: "appointmentId required" });
    const appointment = await triageService.rescheduleAppointment(
      req.user!.userId,
      String(appointmentId),
      { date, time, autoNextSlot, reason },
    );
    return res.json({ appointment });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Reschedule failed";
    return res.status(400).json({ error: msg });
  }
}

export async function nextFreeSlot(req: AuthRequest, res: Response) {
  try {
    const date = (req.query.date as string) || undefined;
    const slot = await getNextFreeSlot(req.user!.userId, date);
    return res.json({ slot });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No slots";
    return res.status(400).json({ error: msg });
  }
}
