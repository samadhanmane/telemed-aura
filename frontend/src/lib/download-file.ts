import { apiClient } from "@/lib/api/client";
import { resolveUploadUrl } from "@/lib/api/upload-url";

function extensionFromUrl(url: string): string | undefined {
  const match = url.match(/\.(pdf|png|jpe?g|docx?|webp)(\?|$)/i);
  return match?.[1]?.toLowerCase().replace("jpg", "jpeg");
}

function buildFilename(fileUrl: string, displayName?: string): string {
  const ext = extensionFromUrl(fileUrl);
  const safeName = (displayName ?? "document")
    .trim()
    .replace(/[^\w.\-() ]+/g, "_")
    .slice(0, 120);

  if (/\.[a-z0-9]{2,5}$/i.test(safeName)) return safeName;
  if (ext === "jpeg") return `${safeName}.jpg`;
  if (ext) return `${safeName}.${ext}`;
  return `${safeName}.pdf`;
}

/** Download report, prescription, certificate, etc. with correct filename and format. */
export async function downloadUploadFile(fileUrl?: string, displayName?: string): Promise<void> {
  const url = resolveUploadUrl(fileUrl);
  if (!url) throw new Error("File not available");

  const filename = buildFilename(url, displayName);

  const { data } = await apiClient.get<Blob>("/files/download", {
    params: { url, filename },
    responseType: "blob",
  });

  const blobUrl = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
