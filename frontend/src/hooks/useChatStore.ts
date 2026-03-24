"use client";

import { create } from "zustand";
import type { ChatMessage, PageContext, SSEEvent } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  isStreaming: boolean;
  currentStatus: string | null;
  dataSummary: string;
  toggleChat: () => void;
  setOpen: (open: boolean) => void;
  setDataSummary: (summary: string) => void;
  sendMessage: (text: string, context: PageContext) => Promise<void>;
  clearMessages: () => void;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isOpen: false,
  isStreaming: false,
  currentStatus: null,
  dataSummary: "",

  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
  setDataSummary: (summary) => set({ dataSummary: summary }),

  clearMessages: () => set({ messages: [] }),

  sendMessage: async (text: string, context: PageContext) => {
    const userMsg: ChatMessage = {
      id: genId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const assistantMsg: ChatMessage = {
      id: genId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg, assistantMsg],
      isStreaming: true,
      currentStatus: "Pensando...",
    }));

    try {
      // Build API messages (last 30 messages to stay within context)
      const allMessages = [...get().messages];
      const apiMessages = allMessages
        .filter((m) => m.content) // skip empty assistant placeholder
        .slice(-30)
        .map((m) => ({ role: m.role, content: m.content }));

      // Add the new user message
      apiMessages.push({ role: "user", content: text });

      const response = await fetch(`${API_URL}/api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          context: {
            current_page: context.currentPage,
            filters: context.filters,
            data_summary: context.dataSummary,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event: SSEEvent = JSON.parse(jsonStr);

            if (event.type === "status") {
              set({ currentStatus: event.text });
            } else if (event.type === "text_delta") {
              fullContent += event.text;
              set((s) => ({
                messages: s.messages.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: fullContent } : m
                ),
              }));
            } else if (event.type === "error") {
              fullContent = `Error: ${event.text}`;
              set((s) => ({
                messages: s.messages.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: fullContent } : m
                ),
              }));
            } else if (event.type === "done") {
              // done
            }
          } catch {
            // skip malformed SSE
          }
        }
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Error desconocido";
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: `Error de conexión: ${errorText}` }
            : m
        ),
      }));
    } finally {
      set({ isStreaming: false, currentStatus: null });
    }
  },
}));
