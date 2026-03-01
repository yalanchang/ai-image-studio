import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface JobUpdate {
  jobId: number;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  message: string;
  resultImageUrl?: string;
}

export function useJobSocket(userId: number | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const [jobUpdates, setJobUpdates] = useState<Record<number, JobUpdate>>({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const socket = io(window.location.origin, {
      path: "/api/socket.io",
      auth: { userId },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("job:update", (update: JobUpdate) => {
      setJobUpdates(prev => ({ ...prev, [update.jobId]: update }));
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [userId]);

  const clearJobUpdate = useCallback((jobId: number) => {
    setJobUpdates(prev => { const n = { ...prev }; delete n[jobId]; return n; });
  }, []);

  return { jobUpdates, connected, clearJobUpdate };
}
