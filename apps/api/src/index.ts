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

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize Socket.io
initSocket(httpServer);

// Global middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.startsWith("http://localhost:")) {
      callback(null, true);
    } else {
      callback(null, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    }
  },
  credentials: true,
}));
app.use(express.json());


// Health check
app.get("/api/health", (_req, res) => {
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

httpServer.listen(PORT, () => {
  console.log(`🚀 Verdiqt API running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for realtime connections`);
});

export default app;
