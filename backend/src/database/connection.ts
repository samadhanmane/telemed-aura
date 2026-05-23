import mongoose from "mongoose";
import { getDatabaseConfig } from "../config/database.js";

let isConnected = false;

export async function connectDatabase(): Promise<typeof mongoose> {
  const { uri, dbName } = getDatabaseConfig();

  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Add it to backend/.env (see .env.example).",
    );
  }

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose;
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 10000,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("querySrv") || msg.includes("ECONNREFUSED")) {
      throw new Error(
        [
          "MongoDB connection failed before reaching the database.",
          "Common on new PCs / school or office networks:",
          "  • DNS blocks mongodb+srv (SRV) lookups — use Atlas “Standard connection string” (mongodb://…:27017) instead of mongodb+srv://",
          "  • No internet or VPN/firewall blocking MongoDB",
          "  • Atlas cluster paused/deleted or wrong URI copied",
          "  • Atlas Network Access: add this machine’s public IP (or 0.0.0.0/0 for dev only)",
          "Local dev without Atlas: MONGODB_URI=mongodb://127.0.0.1:27017",
          `Underlying error: ${msg}`,
        ].join("\n"),
      );
    }
    throw err;
  }

  isConnected = true;
  console.log(`[db] MongoDB connected — database: ${dbName}`);
  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log("[db] MongoDB disconnected");
}

export function getDatabaseStatus(): {
  connected: boolean;
  readyState: number;
  dbName: string;
} {
  const { dbName } = getDatabaseConfig();
  const readyState = mongoose.connection.readyState;
  return {
    connected: readyState === 1,
    readyState,
    dbName,
  };
}
