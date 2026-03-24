"use client";

import { MessageCircle, X } from "lucide-react";
import { useChatStore } from "@/hooks/useChatStore";

export function ChatToggle() {
  const { isOpen, toggleChat, messages } = useChatStore();

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 btn-hover"
      style={{
        background: "var(--gradient-accent)",
        boxShadow: "var(--shadow-glow-red)",
      }}
    >
      {isOpen ? (
        <X size={20} className="text-white" />
      ) : (
        <>
          <MessageCircle size={20} className="text-white" />
          {messages.length > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: "#4E79A7" }}
            >
              {messages.filter((m) => m.role === "assistant" && m.content).length}
            </span>
          )}
        </>
      )}
    </button>
  );
}
