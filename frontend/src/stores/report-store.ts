import { create } from "zustand";
import type { MedicalReport } from "@/types/healthcare";
import { mockReports } from "@/data/mock/healthcare";

interface ReportState {
  reports: MedicalReport[];
  addReport: (report: MedicalReport) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  reports: mockReports,
  addReport: (report) =>
    set((s) => ({ reports: [report, ...s.reports] })),
}));
