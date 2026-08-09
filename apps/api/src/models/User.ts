import mongoose, { Document, Schema, Model } from "mongoose";

export interface IUser extends Document {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: "CLIENT" | "FREELANCER" | "ADMIN";
  avatarUrl?: string | null;
  walletBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["CLIENT", "FREELANCER", "ADMIN"],
      default: "FREELANCER",
    },
    avatarUrl: { type: String, default: null },
    walletBalance: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
