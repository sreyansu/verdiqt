import mongoose from "mongoose";

let isConnected = false;

const TARGET_DB_NAME = process.env.MONGODB_DB_NAME || "verdiqt";

/**
 * Normalizes MongoDB connection URI to guarantee it points to the target database ('verdiqt').
 * Handles cases where cloud hosting (Render, Vercel, Railway) has URIs like:
 * - mongodb+srv://cluster.net
 * - mongodb+srv://cluster.net/
 * - mongodb+srv://cluster.net/?retryWrites=true
 * - mongodb+srv://cluster.net/test?retryWrites=true
 */
function normalizeMongoUri(rawUri: string, targetDb: string): string {
  try {
    // If URI contains /test, replace with targetDb
    if (rawUri.includes(".mongodb.net/test")) {
      return rawUri.replace(".mongodb.net/test", `.mongodb.net/${targetDb}`);
    }

    // If URI has query params but no db path: .mongodb.net/?...
    if (rawUri.includes(".mongodb.net/?")) {
      return rawUri.replace(".mongodb.net/?", `.mongodb.net/${targetDb}?`);
    }

    // If URI ends with .mongodb.net/
    if (rawUri.endsWith(".mongodb.net/")) {
      return `${rawUri}${targetDb}`;
    }

    // If URI ends with .mongodb.net (no slash)
    if (rawUri.endsWith(".mongodb.net")) {
      return `${rawUri}/${targetDb}`;
    }

    // For localhost without db: mongodb://localhost:27017 or mongodb://localhost:27017/
    if (rawUri.startsWith("mongodb://localhost") || rawUri.startsWith("mongodb://127.0.0.1")) {
      if (!rawUri.includes("/", 10)) {
        return `${rawUri}/${targetDb}`;
      }
      if (rawUri.endsWith("/")) {
        return `${rawUri}${targetDb}`;
      }
    }
  } catch (err) {
    console.warn("URI normalization warning:", err);
  }

  return rawUri;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  const rawMongoUri =
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/verdiqt";

  const mongoUri = normalizeMongoUri(rawMongoUri, TARGET_DB_NAME);

  try {
    const conn = await mongoose.connect(mongoUri, {
      dbName: TARGET_DB_NAME, // Explicitly forces Mongoose to use 'verdiqt' database regardless of URI
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = conn.connection.readyState === 1;
    const activeDb = conn.connection.name;
    console.log(`🌿 MongoDB connected successfully: ${conn.connection.host} (database: "${activeDb}")`);

    if (activeDb !== TARGET_DB_NAME) {
      console.warn(`⚠️ Warning: Expected MongoDB database "${TARGET_DB_NAME}" but connected to "${activeDb}".`);
    }

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
