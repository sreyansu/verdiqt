import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IContract extends Document {
  id: string;
  title: string;
  description: string;
  totalAmount: number;
  currency: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "DISPUTED" | "CANCELLED";
  startDate: Date;
  endDate: Date;
  scopeDocument?: string | null;
  clientId: Types.ObjectId;
  freelancerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  client?: any;
  freelancer?: any;
  milestones?: any[];
  escrowWallet?: any;
  dispute?: any;
}

const ContractSchema = new Schema<IContract>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "COMPLETED", "DISPUTED", "CANCELLED"],
      default: "DRAFT",
      index: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    scopeDocument: { type: String, default: null },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    freelancerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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

// Virtual populates
ContractSchema.virtual("client", {
  ref: "User",
  localField: "clientId",
  foreignField: "_id",
  justOne: true,
});

ContractSchema.virtual("freelancer", {
  ref: "User",
  localField: "freelancerId",
  foreignField: "_id",
  justOne: true,
});

ContractSchema.virtual("milestones", {
  ref: "Milestone",
  localField: "_id",
  foreignField: "contractId",
});

ContractSchema.virtual("escrowWallet", {
  ref: "EscrowWallet",
  localField: "_id",
  foreignField: "contractId",
  justOne: true,
});

ContractSchema.virtual("dispute", {
  ref: "Dispute",
  localField: "_id",
  foreignField: "contractId",
  justOne: true,
});

export const Contract: Model<IContract> =
  mongoose.models.Contract || mongoose.model<IContract>("Contract", ContractSchema);

export default Contract;
