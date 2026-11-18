import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";

let io: SocketIOServer;

export function initSocket(httpServer: HttpServer) {
  const origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4000",
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origins.some(o => origin === o || origin.startsWith(o)) || origin.endsWith(".vercel.app")) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join user notification room
    socket.on("joinUser", (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on("leaveUser", (userId: string) => {
      if (userId) {
        socket.leave(`user:${userId}`);
      }
    });

    // Join dispute room for realtime updates
    socket.on("joinDispute", (disputeId: string) => {
      socket.join(`dispute:${disputeId}`);
      console.log(`[Socket] ${socket.id} joined dispute:${disputeId}`);
    });

    socket.on("leaveDispute", (disputeId: string) => {
      socket.leave(`dispute:${disputeId}`);
    });

    // Join conversation room for realtime contract messaging
    socket.on("joinConversation", (conversationId: string) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
        console.log(`[Socket] ${socket.id} joined conversation:${conversationId}`);
      }
    });

    socket.on("leaveConversation", (conversationId: string) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Realtime typing indicators
    socket.on("typing:start", (data: { conversationId: string; userId: string; userName: string }) => {
      if (data?.conversationId) {
        socket.to(`conversation:${data.conversationId}`).emit("typing:active", data);
      }
    });

    socket.on("typing:stop", (data: { conversationId: string; userId: string }) => {
      if (data?.conversationId) {
        socket.to(`conversation:${data.conversationId}`).emit("typing:inactive", data);
      }
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
