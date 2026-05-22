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

  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 10000,
  });

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
