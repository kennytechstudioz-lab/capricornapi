import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server | null = null;

/**
 * Initializes the Socket.io server instance bound to the HTTP Server.
 * 
 * @param httpServer Standard Node HTTP Server instance
 * @returns Server initialized socket container
 */
export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: (requestOrigin, callback) => {
        // Dynamically allow the requesting origin to satisfy browser CORS policies (including credentials & polling)
        callback(null, true);
      },
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join room designated by username for direct push message mapping
    socket.on("join", (username: string) => {
      if (username) {
        const roomName = username.toLowerCase().trim();
        socket.join(roomName);
        console.log(`[Socket.io] Socket ${socket.id} joined channel: "${roomName}"`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Fetches the active Socket.io Server container.
 */
export function getIO(): Server {
  if (!io) {
    throw new Error("[Socket.io] Server has not been initialized yet!");
  }
  return io;
}

/**
 * Emits real-time dynamic notifications directly to joined username channels.
 * 
 * @param username Recipient username room key
 * @param data Notification payload properties
 */
export function emitNotification(username: string, data: any) {
  try {
    const roomName = username.toLowerCase().trim();
    if (io) {
      io.to(roomName).emit("notification", data);
      console.log(`[Socket.io] Pushed real-time alert to "${roomName}" channel.`);
    } else {
      console.warn(`[Socket.io] Cannot emit notification; server not initialized.`);
    }
  } catch (error) {
    console.error(`[Socket.io] Error emitting real-time alert to "${username}":`, error);
  }
}
