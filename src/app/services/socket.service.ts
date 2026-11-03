import { io, Socket } from "socket.io-client";
import { sessionService } from "@/app/services/session.service";
import { refreshAccessToken } from "@/app/api/client";

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (!this.socket) {
      this.socket = io(
        process.env.NEXT_PUBLIC_SOCKET_URL ??
          process.env.NEXT_PUBLIC_API_URL!,
        {
          transports: ["websocket"],
          // A function, evaluated on every (re)connect. A fixed object kept the
          // token from login, so once it expired (15 minutes) every reconnect
          // was rejected and live updates stopped until a page reload.
          auth: (cb) => cb({ token: sessionService.getAccessToken() ?? token }),
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        }
      );

      // The server closes the connection when the token it was opened with
      // expires. socket.io does not auto-reconnect after a server-initiated
      // disconnect, so refresh the token and connect again.
      this.socket.on("disconnect", (reason) => {
        if (reason !== "io server disconnect") return;
        refreshAccessToken()
          .then(() => this.socket?.connect())
          .catch(() => {
            /* signed out — nothing to reconnect to */
          });
      });
    } else {
      this.socket.connect();
    }

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();