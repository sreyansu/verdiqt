import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IEscrowWallet extends Document {
  id: string;
  contractId: Types.ObjectId;
  totalAmount: number;
  heldAmount: number;
  releasedToFreelancer: number;
  refundedToClient: number;
  status: "HOLDING" | "PARTIALLY_RELEASED" | "FULLY_RELEASED" | "REFUNDED" | "FROZEN";
  createdAt: Date;
  updatedAt: Date;
  // Populated
  contract?: any;
}

const EscrowWalletSchema = new Schema<IEscrowWallet>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      unique: true,
      index: true,
    },
    totalAmount: { type: Number, required: true },
    heldAmount: { type: Number, required: true },
    releasedToFreelancer: { type: Number, default: 0 },
    refundedToClient: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["HOLDING", "PARTIALLY_RELEASED", "FULLY_RELEASED", "REFUNDED", "FROZEN"],
      default: "HOLDING",
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

EscrowWalletSchema.virtual("contract", {
  ref: "Contract",
  localField: "contractId",
  foreignField: "_id",
  justOne: true,
});

export const EscrowWallet: Model<IEscrowWallet> =
  mongoose.models.EscrowWallet ||
  mongoose.model<IEscrowWallet>("EscrowWallet", EscrowWalletSchema);

export default EscrowWallet;
