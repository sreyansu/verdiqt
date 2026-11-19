import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IEvidence extends Document {
  id: string;
  disputeId: Types.ObjectId;
  uploadedById: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileType: string;
  publicId?: string | null;
  bytes?: number | null;
  sha256Hash?: string | null;
  mimeType?: string | null;
  provenance?: string | null;
  metadata?: Record<string, any> | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Populated
  dispute?: any;
  uploadedBy?: any;
}

const EvidenceSchema = new Schema<IEvidence>(
  {
    disputeId: {
      type: Schema.Types.ObjectId,
      ref: "Dispute",
      required: true,
      index: true,
    },
    uploadedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    publicId: { type: String, default: null },
    bytes: { type: Number, default: null },
    sha256Hash: { type: String, default: null },
    mimeType: { type: String, default: null },
    provenance: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
    description: { type: String, default: null },
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

EvidenceSchema.virtual("dispute", {
  ref: "Dispute",
  localField: "disputeId",
  foreignField: "_id",
  justOne: true,
});

EvidenceSchema.virtual("uploadedBy", {
  ref: "User",
  localField: "uploadedById",
  foreignField: "_id",
  justOne: true,
});

export const Evidence: Model<IEvidence> =
  mongoose.models.Evidence || mongoose.model<IEvidence>("Evidence", EvidenceSchema);

export default Evidence;
