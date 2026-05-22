import jwt from "jsonwebtoken";

export type VideoSessionPayload = {
  type: "video_session";
  userId: string;
  role: "patient" | "doctor";
  appointmentId: string;
  name: string;
};

export function signVideoSessionToken(payload: Omit<VideoSessionPayload, "type">): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ ...payload, type: "video_session" }, secret, {
    expiresIn: "2h",
  });
}

export function verifyVideoSessionToken(token: string): VideoSessionPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  const decoded = jwt.verify(token, secret) as VideoSessionPayload;
  if (decoded.type !== "video_session") {
    throw new Error("Invalid session type");
  }
  return decoded;
}
