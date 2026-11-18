import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessageAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  bytes?: number;
}

export interface IMessageEncryption {
  algorithm: string; // e.g. "AES-GCM-256"
  iv: string; // Base64 encoded 12-byte initialization vector
  keyId?: string;
  isEncrypted: boolean;
}

export interface IMessage extends Document {
  id: string;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string; // Encrypted ciphertext (base64) or plaintext if unencrypted
  encryption: IMessageEncryption;
  readByIds: Types.ObjectId[];
  attachments: IMessageAttachment[];
  createdAt: Date;
  updatedAt: Date;
  sender?: any;
}

const MessageAttachmentSchema = new Schema<IMessageAttachment>(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, default: "application/octet-stream" },
    bytes: { type: Number, default: 0 },
  },
  { _id: false }
);

const MessageEncryptionSchema = new Schema<IMessageEncryption>(
  {
    algorithm: { type: String, default: "AES-GCM-256" },
    iv: { type: String, default: "" },
    keyId: { type: String, default: "v1" },
    isEncrypted: { type: Boolean, default: true },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true },
    encryption: {
      type: MessageEncryptionSchema,
      default: () => ({
        algorithm: "AES-GCM-256",
        iv: "",
        keyId: "v1",
        isEncrypted: true,
      }),
    },
    readByIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    attachments: { type: [MessageAttachmentSchema], default: [] },
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

MessageSchema.virtual("sender", {
  ref: "User",
  localField: "senderId",
  foreignField: "_id",
  justOne: true,
});

export const Message =
  mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);

