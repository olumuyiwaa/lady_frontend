"use client";

import { useCallback, useEffect } from "react";
import { socketService } from "@/app/services/socket.service";

export type SocketEvent =
  | "new_message"
  | "message_deleted"
  | "message_read"
  | "user_typing"
  | "conversation_updated";

type EventHandler = (data: unknown) => void;

interface UseSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseSocketReturn {
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  emitTyping: (conversationId: string) => void;
  on: (event: SocketEvent, handler: EventHandler) => () => void;
  connected: boolean;
}

export function useSocket(
  options: UseSocketOptions = {}
): UseSocketReturn {
  const { onConnect, onDisconnect } = options;

  useEffect(() => {
    const socket = socketService.getSocket();

    if (!socket) return;

    if (onConnect) {
      socket.on("connect", onConnect);
    }

    if (onDisconnect) {
      socket.on("disconnect", onDisconnect);
    }

    return () => {
      if (onConnect) {
        socket.off("connect", onConnect);
      }

      if (onDisconnect) {
        socket.off("disconnect", onDisconnect);
      }
    };
  }, [onConnect, onDisconnect]);

  const joinConversation = useCallback((conversationId: string) => {
    socketService
      .getSocket()
      ?.emit("join_conversation", conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketService
      .getSocket()
      ?.emit("leave_conversation", conversationId);
  }, []);

  const emitTyping = useCallback((conversationId: string) => {
    socketService
      .getSocket()
      ?.emit("typing", { conversationId });
  }, []);

  const on = useCallback(
    (event: SocketEvent, handler: EventHandler) => {
      const socket = socketService.getSocket();

      if (!socket) {
        return () => {};
      }

      socket.on(event, handler);

      return () => {
        socket.off(event, handler);
      };
    },
    []
  );

  return {
    joinConversation,
    leaveConversation,
    emitTyping,
    on,
    connected: socketService.getSocket()?.connected ?? false,
  };
}