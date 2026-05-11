import "./env";

import { initFirebaseAdmin } from "./middleware/firebaseAuth";
initFirebaseAdmin();

import express from "express";
import cors from "cors";
import { createServer } from "http";

import { errorHandler } from "./middleware/errorHandler";
import { initSocket } from "./lib/socket";

// Route imports
import authRoutes from "./routes/auth";
import contractRoutes from "./routes/contracts";
import milestoneRoutes from "./routes/milestones";
import disputeRoutes from "./routes/disputes";
import evidenceRoutes from "./routes/evidence";
import verdictRoutes from "./routes/verdicts";
import adminRoutes from "./routes/admin";

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
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some((allowed) => origin.startsWith(allowed) || origin === allowed)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());


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

// Error handler (must be last)
app.use(errorHandler);

httpServer.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Verdiqt API running on port ${PORT}`);
  console.log(`📡 Socket.io ready for realtime connections`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
});

export default app;
