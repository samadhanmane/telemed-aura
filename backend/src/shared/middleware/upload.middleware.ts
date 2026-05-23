import multer from "multer";

const ALLOWED_DOCUMENT_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];
const ALLOWED_REPORT_MIME = ALLOWED_DOCUMENT_MIME;
const ALLOWED_RX_MIME = ALLOWED_DOCUMENT_MIME;

const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function resolveMime(file: Express.Multer.File): string {
  if (file.mimetype && file.mimetype !== "application/octet-stream") {
    return file.mimetype === "image/jpg" ? "image/jpeg" : file.mimetype;
  }
  const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext && EXT_TO_MIME[ext] ? EXT_TO_MIME[ext]! : file.mimetype;
}

function fileFilter(allowed: string[]) {
  const allowedNorm = new Set(allowed.map((m) => (m === "image/jpg" ? "image/jpeg" : m)));
  return (_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const mime = resolveMime(file);
    (file as Express.Multer.File & { resolvedMime?: string }).resolvedMime = mime;
    if (allowedNorm.has(mime)) {
      file.mimetype = mime;
      cb(null, true);
      return;
    }
    const ext = file.originalname.toLowerCase().match(/\.(pdf|png|jpe?g|docx)$/)?.[0];
    if (ext && EXT_TO_MIME[ext] && allowedNorm.has(EXT_TO_MIME[ext]!)) {
      file.mimetype = EXT_TO_MIME[ext]!;
      cb(null, true);
      return;
    }
    cb(new Error(`Invalid file type: ${file.mimetype || "unknown"} (${file.originalname}). Use PDF, PNG, JPG, or DOCX.`));
  };
}

/** Memory storage — files go to Cloudinary, not local disk */
const memoryStorage = multer.memoryStorage();

const MAX_REPORT_MB = 20 * 1024 * 1024;

export const uploadReport = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_REPORT_MB },
  fileFilter: fileFilter(ALLOWED_REPORT_MIME),
});

export const uploadPrescriptionImage = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_REPORT_MB },
  fileFilter: fileFilter(ALLOWED_RX_MIME),
});

/** Doctor registration — medical certificate (PDF or image). */
/** Unified Doc Assistant uploads (reports + prescriptions). */
export const uploadDocument = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_REPORT_MB },
  fileFilter: fileFilter(ALLOWED_DOCUMENT_MIME),
});

export const uploadDoctorCertificate = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_REPORT_MB },
  fileFilter: fileFilter(ALLOWED_REPORT_MIME),
});
