"use client";

import type { ChatMessage } from "@/lib/types";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  if (!message.content && !isUser) {
    return null; // Don't render empty assistant messages
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed"
        style={
          isUser
            ? {
                background: "rgba(166, 25, 46, 0.1)",
                color: "var(--text-primary)",
                borderBottomRightRadius: "4px",
              }
            : {
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                borderBottomLeftRadius: "4px",
              }
        }
      >
        <div className="whitespace-pre-wrap break-words chat-content">
          {formatContent(message.content)}
        </div>
      </div>
    </div>
  );
}

function formatContent(content: string): string {
  // Basic formatting: keep as-is, the whitespace-pre-wrap handles newlines
  return content;
}
