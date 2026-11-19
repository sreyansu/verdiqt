import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IAnalysisRun extends Document {
  id: string;
  disputeId: Types.ObjectId;
  disputeVersion: number;
  threadId: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "ESCALATED";
  modelId: string;
  promptVersion: string;
  agentVersion: string;
  rubricVersion: string;
  legalCorpusVersion: string;
  readinessSnapshot?: {
    clientReady: boolean;
    freelancerReady: boolean;
    timestamp: Date;
  };
  evidenceSnapshot?: Array<{
    id: string;
    fileName: string;
    sha256Hash?: string | null;
    fileUrl?: string;
  }>;
  graphCheckpoints?: Array<{
    node: string;
    timestamp: Date;
    durationMs?: number;
    error?: string | null;
  }>;
  resultVerdictId?: Types.ObjectId | null;
  startedAt: Date;
  completedAt?: Date | null;
  errorDetails?: string | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisRunSchema = new Schema<IAnalysisRun>(
  {
    disputeId: {
      type: Schema.Types.ObjectId,
      ref: "Dispute",
      required: true,
      index: true,
    },
    disputeVersion: { type: Number, required: true, default: 1 },
    threadId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "ESCALATED"],
      default: "PENDING",
      index: true,
    },
    modelId: { type: String, required: true },
    promptVersion: { type: String, default: "v2.0-qme" },
    agentVersion: { type: String, default: "v2.0-tribunal" },
    rubricVersion: { type: String, default: "v2.0-deterministic" },
    legalCorpusVersion: { type: String, default: "v2024-IN" },
    readinessSnapshot: {
      clientReady: { type: Boolean },
      freelancerReady: { type: Boolean },
      timestamp: { type: Date, default: Date.now },
    },
    evidenceSnapshot: [
      {
        id: { type: String },
        fileName: { type: String },
        sha256Hash: { type: String, default: null },
        fileUrl: { type: String },
      },
    ],
    graphCheckpoints: [
      {
        node: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        durationMs: { type: Number },
        error: { type: String, default: null },
      },
    ],
    resultVerdictId: {
      type: Schema.Types.ObjectId,
      ref: "Verdict",
      default: null,
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    errorDetails: { type: String, default: null },
    retryCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const AnalysisRun: Model<IAnalysisRun> =
  mongoose.models.AnalysisRun || mongoose.model<IAnalysisRun>("AnalysisRun", AnalysisRunSchema);

export default AnalysisRun;

