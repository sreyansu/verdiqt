import "./env";

import { initFirebaseAdmin } from "./middleware/firebaseAuth";
initFirebaseAdmin();

import express from "express";
import cors from "cors";
import { createServer } from "http";

import { errorHandler } from "./middleware/errorHandler";
import { initSocket } from "./lib/socket";
import { connectDB } from "./lib/db";

// Connect to MongoDB
connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB on startup:", err);
});

// Route imports
import authRoutes from "./routes/auth";
import contractRoutes from "./routes/contracts";
import milestoneRoutes from "./routes/milestones";
import disputeRoutes from "./routes/disputes";
import evidenceRoutes from "./routes/evidence";
import verdictRoutes from "./routes/verdicts";
import adminRoutes from "./routes/admin";
import notificationRoutes from "./routes/notifications";
import userRoutes from "./routes/users";
import messageRoutes from "./routes/messages";

const app: any = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize Socket.io
initSocket(httpServer);

// Global middleware
// Build allowed origins list from env
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:4000",
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.FRONTEND_URL,
].filter(Boolean).map(url => String(url).replace(/\/$/, "")) as string[];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    
    // Explicitly allowed origins
    if (allowedOrigins.some((allowed) => origin === allowed || origin.startsWith(allowed))) {
      return callback(null, true);
    }
    
    // Allow all Vercel deployment domains (production & preview branches)
    if (origin.endsWith(".vercel.app") || /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// Root info
app.get("/", (_req: any, res: any) => {
  res.json({
    message: "Verdiqt API is running",
    health: "/api/health",
    frontend: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  });
});

// Health check
app.get("/api/health", (_req: any, res: any) => {
  res.json({
    status: "ok",
    service: "verdiqt-api",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/verdicts", verdictRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// Error handler (must be last)
app.use(errorHandler);

httpServer.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Verdiqt API running on port ${PORT}`);
  console.log(`📡 Socket.io ready for realtime connections`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
});

export default app;
