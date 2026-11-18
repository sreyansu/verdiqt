import mongoose, { Document, Schema, Types } from "mongoose";

export interface IConversation extends Document {
  id: string;
  contractId: Types.ObjectId;
  participantIds: Types.ObjectId[];
  lastMessageAt?: Date | null;
  lastMessagePreview?: string | null;
  createdAt: Date;
  updatedAt: Date;
  contract?: any;
  participants?: any[];
}

const ConversationSchema = new Schema<IConversation>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      unique: true, // Exactly one primary conversation per contract
      index: true,
    },
    participantIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    ],
    lastMessageAt: { type: Date, default: null },
    lastMessagePreview: { type: String, default: null },
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

// Virtuals for populating participants and contract
ConversationSchema.virtual("contract", {
  ref: "Contract",
  localField: "contractId",
  foreignField: "_id",
  justOne: true,
});

ConversationSchema.virtual("participants", {
  ref: "User",
  localField: "participantIds",
  foreignField: "_id",
});

export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

