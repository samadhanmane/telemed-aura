import { v2 as cloudinary } from "cloudinary";

export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  bytes: number;
};

function readCloudinaryEnv() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_NAME ?? process.env.CLOUDINARY_CLOUD;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret =
    process.env.CLOUDINARY_API_SECRET ??
    process.env.CLOUDINARY_SECRET_KEY ??
    process.env.CLOUDINARY_API_SECRET_KEY;
  return { cloudName, apiKey, apiSecret };
}

function configure() {
  const { cloudName, apiKey, apiSecret } = readCloudinaryEnv();
  if (!cloudName || !apiKey || !apiSecret) return false;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return true;
}

export function isCloudinaryConfigured(): boolean {
  const { cloudName, apiKey, apiSecret } = readCloudinaryEnv();
  return Boolean(cloudName && apiKey && apiSecret);
}

/** Apply env to Cloudinary SDK; returns false if credentials missing. */
export function applyCloudinaryConfig(): boolean {
  return configure();
}

export function requireCloudinary(): void {
  if (!configure()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME (or CLOUDINARY_NAME), CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_SECRET_KEY) in backend/.env",
    );
  }
}

/**
 * Upload medical file (report PDF/image or prescription image) to Cloudinary.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  opts: {
    folder: string;
    filename: string;
    mimeType: string;
  },
): Promise<CloudinaryUploadResult> {
  requireCloudinary();

  const safeName = opts.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const resourceType =
    opts.mimeType === "application/pdf" ? "raw" : opts.mimeType.startsWith("image/") ? "image" : "auto";

  const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: opts.folder,
        public_id: `${Date.now()}-${safeName.replace(/\.[^.]+$/, "")}`,
        resource_type: resourceType,
        overwrite: false,
      },
      (err, res) => {
        if (err || !res) reject(err ?? new Error("Cloudinary upload failed"));
        else
          resolve({
            secureUrl: res.secure_url,
            publicId: res.public_id,
            resourceType: res.resource_type,
            bytes: res.bytes,
          });
      },
    );
    stream.end(buffer);
  });

  return result;
}

/** Download file from Cloudinary (or any HTTPS URL) for AI text extraction */
export async function fetchFileBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch file from storage: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
