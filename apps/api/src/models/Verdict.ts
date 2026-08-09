import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IVerdict extends Document {
  id: string;
  disputeId: Types.ObjectId;
  clientFaultPercent: number;
  freelancerFaultPercent: number;
  clientRefundPercent: number;
  freelancerReleasePercent: number;
  reasoning: string;
  contractAnalysis: string;
  evidenceSummary: string;
  confidenceScore: number;
  escalatedToHuman: boolean;
  modelUsed: string;
  legalBasis?: string | null;
  escalationReason?: string | null;
  clientAdvocateReport?: string | null;
  freelancerDefenseReport?: string | null;
  forensicAuditReport?: string | null;
  juryPanelReport?: string | null;
  quantumMeruitCalculation?: any;
  awardHash?: string | null;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Populated
  dispute?: any;
}

const VerdictSchema = new Schema<IVerdict>(
  {
    disputeId: {
      type: Schema.Types.ObjectId,
      ref: "Dispute",
      required: true,
      unique: true,
      index: true,
    },
    clientFaultPercent: { type: Number, required: true },
    freelancerFaultPercent: { type: Number, required: true },
    clientRefundPercent: { type: Number, required: true },
    freelancerReleasePercent: { type: Number, required: true },
    reasoning: { type: String, required: true },
    contractAnalysis: { type: String, required: true },
    evidenceSummary: { type: String, required: true },
    confidenceScore: { type: Number, required: true },
    escalatedToHuman: { type: Boolean, default: false },
    modelUsed: { type: String, required: true },
    legalBasis: { type: String, default: null },
    escalationReason: { type: String, default: null },
    clientAdvocateReport: { type: String, default: null },
    freelancerDefenseReport: { type: String, default: null },
    forensicAuditReport: { type: String, default: null },
    juryPanelReport: { type: String, default: null },
    quantumMeruitCalculation: { type: Schema.Types.Mixed, default: null },
    awardHash: { type: String, default: null },
    acceptedAt: { type: Date, default: null },
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

VerdictSchema.virtual("dispute", {
  ref: "Dispute",
  localField: "disputeId",
  foreignField: "_id",
  justOne: true,
});

export const Verdict: Model<IVerdict> =
  mongoose.models.Verdict || mongoose.model<IVerdict>("Verdict", VerdictSchema);

export default Verdict;
