import mongoose, { Schema, type Document, type Model } from "mongoose";

export type UserRole = "patient" | "doctor" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  location?: string;
  healthScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["patient", "doctor", "admin"], required: true },
    phone: { type: String },
    location: { type: String },
    healthScore: { type: Number, default: 82 },
  },
  { timestamps: true },
);

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
