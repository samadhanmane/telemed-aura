import { Router } from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { extractTextFromFile, parsePrescriptionText, validateUploadMime } from "../core/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../../../uploads/ai-ocr");

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^\w.-]/g, "_")}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (validateUploadMime(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, PNG, JPG allowed"));
  },
});

export const ocrRoutes = Router();

ocrRoutes.post("/text", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });
  const result = parsePrescriptionText(String(text));
  return res.json({ success: true, result });
});

ocrRoutes.post("/file", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "file required" });

  try {
    const { text } = await extractTextFromFile(file.path, file.mimetype);
    const result = parsePrescriptionText(text);
    await fs.unlink(file.path).catch(() => {});
    return res.json({ success: true, result });
  } catch (e) {
    if (file.path) await fs.unlink(file.path).catch(() => {});
    return res.status(500).json({ error: e instanceof Error ? e.message : "OCR failed" });
  }
});
