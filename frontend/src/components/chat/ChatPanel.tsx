"use client";

import { useRef, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { useChatStore } from "@/hooks/useChatStore";
import { usePageContext } from "@/hooks/usePageContext";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";

export function ChatPanel() {
  const { messages, isOpen, isStreaming, currentStatus, toggleChat, clearMessages, sendMessage } =
    useChatStore();
  const context = usePageContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentStatus]);

  if (!isOpen) return null;

  const handleSend = (text: string) => {
    sendMessage(text, context);
  };

  return (
    <aside
      className="flex h-screen w-96 flex-col border-l animate-slide-in-left"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-primary)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: "var(--gradient-accent)" }}
          >
            AI
          </div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Asistente de Pricing
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="rounded-md p-1.5 transition-colors hover:bg-black/5"
              title="Limpiar conversación"
            >
              <Trash2 size={14} style={{ color: "var(--text-tertiary)" }} />
            </button>
          )}
          <button
            onClick={toggleChat}
            className="rounded-md p-1.5 transition-colors hover:bg-black/5"
          >
            <X size={16} style={{ color: "var(--text-tertiary)" }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white mb-3"
              style={{ background: "var(--gradient-accent)", opacity: 0.8 }}
            >
              AI
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Pregunta sobre tus datos
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Puedo analizar ingresos, elasticidades, simular cambios de precio y más.
            </p>
            <div className="mt-4 space-y-2 w-full">
              {[
                "¿Cuál es el revenue total por segmento?",
                "¿Qué categoría tiene mayor elasticidad?",
                "Simula un aumento del 5% en Tableros",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors hover:bg-black/5"
                  style={{
                    border: "1px solid var(--border-secondary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && currentStatus && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--usg-red)" }} />
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--usg-red)", animationDelay: "0.2s" }} />
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--usg-red)", animationDelay: "0.4s" }} />
            </div>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {currentStatus}
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </aside>
  );
}
