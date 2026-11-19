import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IHumanReview extends Document {
  id: string;
  disputeId: Types.ObjectId;
  sourceAnalysisRunId?: string | null;
  reviewVersion: number;
  requestedBy?: Types.ObjectId | null;
  requestedByRole: "CLIENT" | "FREELANCER" | "SYSTEM_AUTOMATIC" | "ADMIN";
  requestReason: string;
  reviewType: "TECHNICAL" | "EVIDENCE" | "LEGAL" | "FULL";
  status:
    | "REQUESTED"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "AWAITING_INFORMATION"
    | "COMPLETED"
    | "CANCELLED";
  reviewerId?: Types.ObjectId | null;
  reviewerName?: string | null;
  conflictCheckStatus?: "CLEARED" | "FLAGGED" | "PENDING";
  reviewerFindings?: string | null;
  reviewerEvidenceReferences?: string[];
  outcome?:
    | "CONFIRM_RECOMMENDATION"
    | "MODIFY_RECOMMENDATION"
    | "REQUEST_MORE_EVIDENCE"
    | "UNABLE_TO_DETERMINE"
    | "RECOMMEND_NEGOTIATION"
    | null;
  modifiedRefundPercent?: number | null;
  modifiedReleasePercent?: number | null;
  outcomeReason?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  dispute?: any;
  reviewer?: any;
}

const HumanReviewSchema = new Schema<IHumanReview>(
  {
    disputeId: {
      type: Schema.Types.ObjectId,
      ref: "Dispute",
      required: true,
      index: true,
    },
    sourceAnalysisRunId: { type: String, default: null },
    reviewVersion: { type: Number, default: 1 },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    requestedByRole: {
      type: String,
      enum: ["CLIENT", "FREELANCER", "SYSTEM_AUTOMATIC", "ADMIN"],
      required: true,
    },
    requestReason: { type: String, required: true },
    reviewType: {
      type: String,
      enum: ["TECHNICAL", "EVIDENCE", "LEGAL", "FULL"],
      default: "FULL",
    },
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "ASSIGNED",
        "IN_PROGRESS",
        "AWAITING_INFORMATION",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "REQUESTED",
      index: true,
    },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewerName: { type: String, default: null },
    conflictCheckStatus: {
      type: String,
      enum: ["CLEARED", "FLAGGED", "PENDING"],
      default: "PENDING",
    },
    reviewerFindings: { type: String, default: null },
    reviewerEvidenceReferences: [{ type: String }],
    outcome: {
      type: String,
      enum: [
        "CONFIRM_RECOMMENDATION",
        "MODIFY_RECOMMENDATION",
        "REQUEST_MORE_EVIDENCE",
        "UNABLE_TO_DETERMINE",
        "RECOMMEND_NEGOTIATION",
      ],
      default: null,
    },
    modifiedRefundPercent: { type: Number, default: null },
    modifiedReleasePercent: { type: Number, default: null },
    outcomeReason: { type: String, default: null },
    completedAt: { type: Date, default: null },
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

HumanReviewSchema.virtual("dispute", {
  ref: "Dispute",
  localField: "disputeId",
  foreignField: "_id",
  justOne: true,
});

HumanReviewSchema.virtual("reviewer", {
  ref: "User",
  localField: "reviewerId",
  foreignField: "_id",
  justOne: true,
});

export const HumanReview: Model<IHumanReview> =
  mongoose.models.HumanReview || mongoose.model<IHumanReview>("HumanReview", HumanReviewSchema);

export default HumanReview;

