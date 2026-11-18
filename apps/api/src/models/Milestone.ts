import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IMilestoneSubmissionHistory {
  submissionNote?: string | null;
  submissionFiles?: any;
  submittedAt?: Date | null;
  rejectionReason?: string | null;
}

export interface IMilestone extends Document {
  id: string;
  contractId: Types.ObjectId;
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED" | "DISPUTED";
  completedAt?: Date | null;
  submissionNote?: string | null;
  submissionFiles?: any;
  submittedAt?: Date | null;
  rejectionReason?: string | null;
  submissionHistory?: IMilestoneSubmissionHistory[];
  createdAt: Date;
  updatedAt: Date;
  // Populated
  contract?: any;
}

const MilestoneSchema = new Schema<IMilestone>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PENDING", "SUBMITTED", "APPROVED", "REJECTED", "DISPUTED"],
      default: "PENDING",
      index: true,
    },
    completedAt: { type: Date, default: null },
    submissionNote: { type: String, default: null },
    submissionFiles: { type: Schema.Types.Mixed, default: null },
    submittedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    submissionHistory: { type: [Schema.Types.Mixed], default: [] },
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

MilestoneSchema.virtual("contract", {
  ref: "Contract",
  localField: "contractId",
  foreignField: "_id",
  justOne: true,
});

export const Milestone: Model<IMilestone> =
  mongoose.models.Milestone || mongoose.model<IMilestone>("Milestone", MilestoneSchema);

export default Milestone;
