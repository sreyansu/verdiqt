"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function useDisputeRealtime(
  disputeId: string | undefined,
  onStatusChange: (status: string) => void
) {
  useEffect(() => {
    if (!disputeId) return;

    const s = getSocket();
    s.emit("joinDispute", disputeId);

    s.on("disputeStatusChange", (data: { disputeId: string; status: string }) => {
      if (data.disputeId === disputeId) {
        onStatusChange(data.status);
      }
    });

    return () => {
      s.emit("leaveDispute", disputeId);
      s.off("disputeStatusChange");
    };
  }, [disputeId, onStatusChange]);
}
