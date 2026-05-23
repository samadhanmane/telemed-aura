import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IAiChartSeries {
  id: string;
  title: string;
  type: "bar" | "line" | "comparison" | "vitals" | "risk" | "pie" | "area" | "radar";
  data: { label: string; value: number; ref?: string; unit?: string }[];
}

export interface IAiExtractedVitals {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  fastingGlucose?: number;
  randomGlucose?: number;
  hba1c?: number;
  hemoglobin?: number;
  totalCholesterol?: number;
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
}

export interface IDoctorReportReview {
  doctorId: string;
  remarks: string;
  severityOverride?: "Low" | "Moderate" | "High" | "Critical";
  confirmedFlags?: string[];
  reviewedAt: string;
}

export interface IPossibleDisease {
  name: string;
  likelihood: string;
  source: "gemini" | "rules" | "both";
  note?: string;
}

export interface IKeyLabFinding {
  test: string;
  value: string;
  status?: string;
  refRange?: string;
}

export interface IAiAnalysis {
  patientProblemSummary?: string;
  clinicalBrief?: string;
  finalVerdict?: string;
  assessmentBasis?: string[];
  symptomsFromReport?: string[];
  possibleDiseases?: IPossibleDisease[];
  keyLabFindings?: IKeyLabFinding[];
  analysisDetails?: string[];
  summary: string;
  riskScore: number;
  severity: "Low" | "Moderate" | "High" | "Critical";
  suggestedSpecialist?: string;
  insights: string[];
  chartData: { label: string; value: number; ref?: string; unit?: string }[];
  charts?: IAiChartSeries[];
  abnormalities?: string[];
  extractedVitals?: IAiExtractedVitals;
  pipeline?: {
    extractionMethod: string;
    pageCount?: number;
    visionUsed: boolean;
    synthesisUsed: boolean;
    mlUsed: boolean;
    detectedConditions: string[];
    documentType?: string;
    remarkAdjusted?: boolean;
    chunksIndexed?: number;
    scanSummary?: {
      totalPages: number;
      pagesScanned: number;
      pagesFailed: number;
      pagesRemaining: number[];
      imagesDetected: number;
      imagesOcred: number;
      scanSuccessPercent: number;
      dataRetrievalPercent: number;
      summaryShort: string;
      primaryMethod: string;
      pageDetails?: {
        page_num: number;
        status: string;
        method: string;
        char_count: number;
        image_count: number;
      }[];
    };
  };
  doctorReview?: IDoctorReportReview;
  guidance?: {
    pros: string[];
    cons: string[];
    doList: string[];
    avoidList: string[];
  };
}

export interface IMedicalReport extends Document {
  patientId: Types.ObjectId;
  name: string;
  type: "PDF" | "PNG" | "JPG";
  category: string;
  uploadDate: string;
  fileUrl?: string;
  cloudinaryPublicId?: string;
  aiAnalysis?: IAiAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const aiAnalysisSchema = new Schema<IAiAnalysis>(
  {
    summary: { type: String, required: true },
    riskScore: { type: Number, required: true },
    severity: { type: String, enum: ["Low", "Moderate", "High", "Critical"], required: true },
    abnormalities: { type: [String], default: [] },
    guidance: {
      type: {
        pros: { type: [String], default: [] },
        cons: { type: [String], default: [] },
        doList: { type: [String], default: [] },
        avoidList: { type: [String], default: [] },
      },
      required: false,
    },
    suggestedSpecialist: { type: String },
    patientProblemSummary: { type: String },
    clinicalBrief: { type: String },
    finalVerdict: { type: String },
    assessmentBasis: { type: [String], default: [] },
    symptomsFromReport: { type: [String], default: [] },
    possibleDiseases: {
      type: [
        {
          name: { type: String, required: true },
          likelihood: { type: String, required: true },
          source: { type: String, enum: ["gemini", "rules", "both"], required: true },
          note: String,
        },
      ],
      default: [],
    },
    keyLabFindings: {
      type: [
        {
          test: { type: String, required: true },
          value: { type: String, required: true },
          status: String,
          refRange: String,
        },
      ],
      default: [],
    },
    analysisDetails: { type: [String], default: [] },
    insights: { type: [String], default: [] },
    chartData: {
      type: [
        {
          label: String,
          value: Number,
          ref: String,
          unit: String,
        },
      ],
      default: [],
    },
    charts: {
      type: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true },
          // Field named "type" — must use { type: String } or Mongoose treats charts as [String].
          type: {
            type: String,
            enum: ["bar", "line", "comparison", "vitals", "risk", "pie", "area", "radar"],
            required: true,
          },
          data: {
            type: [
              {
                label: { type: String, required: true },
                value: { type: Number, required: true },
                ref: String,
                unit: String,
              },
            ],
            default: [],
          },
        },
      ],
      default: [],
    },
    extractedVitals: { type: Schema.Types.Mixed },
    pipeline: { type: Schema.Types.Mixed },
    doctorReview: {
      type: {
        doctorId: String,
        remarks: String,
        severityOverride: String,
        confirmedFlags: [String],
        reviewedAt: String,
      },
      required: false,
    },
  },
  { _id: false },
);

const medicalReportSchema = new Schema<IMedicalReport>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["PDF", "PNG", "JPG"], required: true },
    category: { type: String, required: true },
    uploadDate: { type: String, required: true },
    fileUrl: { type: String },
    cloudinaryPublicId: { type: String },
    aiAnalysis: { type: aiAnalysisSchema },
  },
  { timestamps: true },
);

medicalReportSchema.index({ patientId: 1, createdAt: -1 });

export const MedicalReport: Model<IMedicalReport> =
  mongoose.models.MedicalReport ??
  mongoose.model<IMedicalReport>("MedicalReport", medicalReportSchema);
