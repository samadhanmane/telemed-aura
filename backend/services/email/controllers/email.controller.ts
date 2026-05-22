import type { Request, Response } from "express";

export const emailController = {
  send: async (_req: Request, res: Response) => {
    res.status(501).json({ message: "Generic send — not implemented" });
  },
  appointment: async (_req: Request, res: Response) => {
    res.status(501).json({ message: "Appointment email — not implemented" });
  },
  prescription: async (_req: Request, res: Response) => {
    res.status(501).json({ message: "Prescription email — not implemented" });
  },
  videoInvite: async (_req: Request, res: Response) => {
    res.status(501).json({ message: "Video invite email — not implemented" });
  },
  aiAlert: async (_req: Request, res: Response) => {
    res.status(501).json({ message: "AI alert email — not implemented" });
  },
};
