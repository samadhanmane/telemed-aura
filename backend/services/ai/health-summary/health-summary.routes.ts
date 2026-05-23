import { Router } from "express";

/** Stateless — caller sends aggregated stats */
export const healthSummaryRoutes = Router();

healthSummaryRoutes.post("/build", (req, res) => {
  const {
    healthScore = 82,
    reportRisks = [],
    scanRisks = [],
    consultationsCompleted = 0,
    reportsOnFile = 0,
    chronicDiseases = [],
  } = req.body;

  const allRisks = [...reportRisks, ...scanRisks];
  let computedRisk = healthScore;
  if (allRisks.length) {
    computedRisk = Math.round(allRisks.reduce((a: number, b: number) => a + b, 0) / allRisks.length);
  }

  const lines: string[] = [];
  if (computedRisk >= 65) {
    lines.push("Elevated health risk based on recent scans and reports.");
    lines.push("Recommended: specialist consultation within the next week.");
  } else if (computedRisk >= 45) {
    lines.push("Health indicators are mostly stable with areas to monitor.");
  } else {
    lines.push("Your health score is stable. Keep up regular check-ups.");
  }

  if (chronicDiseases?.length) lines.push(`Managing: ${chronicDiseases.join(", ")}.`);

  return res.json({
    success: true,
    summary: {
      healthScore,
      computedRisk,
      summary: lines.join(" "),
      consultationsCompleted,
      reportsOnFile,
    },
  });
});
