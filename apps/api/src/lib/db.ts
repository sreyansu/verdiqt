import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  const mongoUri =
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/verdiqt";

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = conn.connection.readyState === 1;
    console.log(`🌿 MongoDB connected successfully: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting reconnect...");
      isConnected = false;
    });

    return conn;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    throw error;
  }
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export default connectDB;
