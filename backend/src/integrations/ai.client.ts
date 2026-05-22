import { serviceUrls } from "../config/services.js";

export async function callAi(path: string, body: unknown) {
  const res = await fetch(`${serviceUrls.ai}/api/ai/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
