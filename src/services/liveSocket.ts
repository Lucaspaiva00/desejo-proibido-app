import { io, Socket } from "socket.io-client";
import { obterToken } from "../storage/auth";

const SOCKET_ORIGIN = process.env.EXPO_PUBLIC_SOCKET_URL || "https://desejoproibido.app";

let socketPromise: Promise<Socket> | null = null;

export async function getRealtimeSocket(): Promise<Socket> {
  if (socketPromise) return socketPromise;

  socketPromise = (async () => {
    const token = await obterToken();
    if (!token) throw new Error("Sessão expirada");

    return io(SOCKET_ORIGIN, {
      path: "/api/socket.io",
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      timeout: 12000,
      auth: { token },
    });
  })().catch((error) => {
    socketPromise = null;
    throw error;
  });

  return socketPromise;
}

export async function resetRealtimeSocket() {
  if (!socketPromise) return;
  try {
    const socket = await socketPromise;
    socket.disconnect();
  } finally {
    socketPromise = null;
  }
}
