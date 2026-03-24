"use client";

import type { ChatMessage } from "@/lib/types";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  if (!message.content && !isUser) {
    return null;
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
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <div
            className="break-words chat-markdown"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}
      </div>
    </div>
  );
}

function renderMarkdown(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      // Headers
      if (line.startsWith("### ")) return `<h4 class="chat-h4">${inline(line.slice(4))}</h4>`;
      if (line.startsWith("## ")) return `<h3 class="chat-h3">${inline(line.slice(3))}</h3>`;
      if (line.startsWith("# ")) return `<h3 class="chat-h3">${inline(line.slice(2))}</h3>`;

      // Bullet lists
      if (line.startsWith("- ") || line.startsWith("* "))
        return `<li class="chat-li">${inline(line.slice(2))}</li>`;

      // Numbered lists
      const numMatch = line.match(/^\d+\.\s(.*)/);
      if (numMatch) return `<li class="chat-li-num">${inline(numMatch[1])}</li>`;

      // Empty line → paragraph break
      if (line.trim() === "") return "<br/>";

      // Regular paragraph
      return `<p class="chat-p">${inline(line)}</p>`;
    })
    .join("");
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="chat-code">$1</code>');
}
