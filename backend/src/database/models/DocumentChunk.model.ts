import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IDocumentChunk extends Document {
  patientId: Types.ObjectId;
  documentId: string;
  sourceType: "report" | "prescription";
  chunkId: string;
  text: string;
  embedding: number[];
  filename: string;
  pageNumber: number;
  chunkIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const documentChunkSchema = new Schema<IDocumentChunk>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    documentId: { type: String, required: true, index: true },
    sourceType: { type: String, enum: ["report", "prescription"], required: true },
    chunkId: { type: String, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    filename: { type: String, required: true },
    pageNumber: { type: Number, default: 1 },
    chunkIndex: { type: Number, default: 0 },
  },
  { timestamps: true },
);

documentChunkSchema.index({ patientId: 1, documentId: 1 });
documentChunkSchema.index({ patientId: 1, chunkId: 1 }, { unique: true });

export const DocumentChunk: Model<IDocumentChunk> =
  mongoose.models.DocumentChunk ??
  mongoose.model<IDocumentChunk>("DocumentChunk", documentChunkSchema);
