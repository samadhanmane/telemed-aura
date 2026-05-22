import { serviceUrls } from "../config/services.js";

export async function callVideo(path: string, body: unknown) {
  const res = await fetch(`${serviceUrls.video}/api/video/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
