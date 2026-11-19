import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IDispute extends Document {
  id: string;
  contractId: Types.ObjectId;
  raisedById: Types.ObjectId;
  title: string;
  clientStatement?: string | null;
  freelancerStatement?: string | null;
  status:
    | "OPEN"
    | "EVIDENCE_COLLECTION"
    | "AI_ANALYZING"
    | "VERDICT_READY"
    | "ESCALATED"
    | "RESOLVED"
    | "CHALLENGED"
    | "AWAITING_AI";
  clientReady: boolean;
  freelancerReady: boolean;
  version: number;
  activeAnalysisRunId?: string | null;
  humanReviewId?: Types.ObjectId | null;
  humanReviewRequested: boolean;
  auditTrail: Array<{
    action: string;
    actorId?: Types.ObjectId | string | null;
    actorRole?: string | null;
    timestamp: Date;
    details?: any;
  }>;
  challengeReason?: string | null;
  challengedById?: Types.ObjectId | null;
  challengeCount: number;
  createdAt: Date;
  resolvedAt?: Date | null;
  // Populated
  contract?: any;
  raisedBy?: any;
  evidence?: any[];
  verdict?: any;
}

const DisputeSchema = new Schema<IDispute>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      unique: true,
      index: true,
    },
    raisedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    clientStatement: { type: String, default: null },
    freelancerStatement: { type: String, default: null },
    status: {
      type: String,
      enum: [
        "OPEN",
        "EVIDENCE_COLLECTION",
        "AI_ANALYZING",
        "VERDICT_READY",
        "ESCALATED",
        "RESOLVED",
        "CHALLENGED",
        "AWAITING_AI",
      ],
      default: "OPEN",
      index: true,
    },
    clientReady: { type: Boolean, default: false },
    freelancerReady: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    activeAnalysisRunId: { type: String, default: null },
    humanReviewId: { type: Schema.Types.ObjectId, ref: "HumanReview", default: null },
    humanReviewRequested: { type: Boolean, default: false },
    auditTrail: [
      {
        action: { type: String, required: true },
        actorId: { type: Schema.Types.Mixed, default: null },
        actorRole: { type: String, default: null },
        timestamp: { type: Date, default: Date.now },
        details: { type: Schema.Types.Mixed, default: null },
      },
    ],
    challengeReason: { type: String, default: null },
    challengedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    challengeCount: { type: Number, default: 0 },
    resolvedAt: { type: Date, default: null },
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

DisputeSchema.virtual("contract", {
  ref: "Contract",
  localField: "contractId",
  foreignField: "_id",
  justOne: true,
});

DisputeSchema.virtual("raisedBy", {
  ref: "User",
  localField: "raisedById",
  foreignField: "_id",
  justOne: true,
});

DisputeSchema.virtual("evidence", {
  ref: "Evidence",
  localField: "_id",
  foreignField: "disputeId",
});

DisputeSchema.virtual("verdict", {
  ref: "Verdict",
  localField: "_id",
  foreignField: "disputeId",
  justOne: true,
});

export const Dispute: Model<IDispute> =
  mongoose.models.Dispute || mongoose.model<IDispute>("Dispute", DisputeSchema);

export default Dispute;
