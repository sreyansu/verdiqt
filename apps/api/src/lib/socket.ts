import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";

let io: SocketIOServer;

export function initSocket(httpServer: HttpServer) {
  const origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[];

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: origins,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join dispute room for realtime updates
    socket.on("joinDispute", (disputeId: string) => {
      socket.join(`dispute:${disputeId}`);
      console.log(`[Socket] ${socket.id} joined dispute:${disputeId}`);
    });

    socket.on("leaveDispute", (disputeId: string) => {
      socket.leave(`dispute:${disputeId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
}
