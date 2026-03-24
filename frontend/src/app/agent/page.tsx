"use client";

import { useRef, useEffect } from "react";
import { Trash2, Bot } from "lucide-react";
import { useChatStore } from "@/hooks/useChatStore";
import { usePageContext } from "@/hooks/usePageContext";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";

export default function AgentPage() {
  const { messages, isStreaming, currentStatus, clearMessages, sendMessage } = useChatStore();
  const context = usePageContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentStatus]);

  const handleSend = (text: string) => {
    sendMessage(text, context);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold"
            style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-glow-red)" }}
          >
            <Bot size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Asistente de Pricing AI
            </h1>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Consulta datos, analiza tendencias y simula escenarios con lenguaje natural
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-black/5"
            style={{ color: "var(--text-tertiary)", border: "1px solid var(--border-secondary)" }}
          >
            <Trash2 size={12} />
            Limpiar
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-xl px-6 py-6 space-y-4"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-white mb-4"
              style={{ background: "var(--gradient-accent)", opacity: 0.8 }}
            >
              <Bot size={28} />
            </div>
            <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
              ¿En qué puedo ayudarte?
            </p>
            <p className="text-sm mt-1 max-w-md" style={{ color: "var(--text-tertiary)" }}>
              Puedo consultar KPIs, analizar elasticidades, simular cambios de precio, revisar recomendaciones y más.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-lg">
              {[
                "¿Cuál es el revenue total y cómo se distribuye por categoría?",
                "¿Qué productos tienen mayor elasticidad de precio?",
                "Simula un aumento del 5% en la categoría Tableros",
                "¿Qué recomiendas para el segmento oro?",
                "¿Cómo han evolucionado los rebates en los últimos 12 meses?",
                "¿Cuál es la descomposición de precio por segmento?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-left text-xs px-4 py-3 rounded-lg transition-colors hover:bg-black/5"
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
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--usg-red)" }} />
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--usg-red)", animationDelay: "0.2s" }} />
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--usg-red)", animationDelay: "0.4s" }} />
            </div>
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {currentStatus}
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="py-4">
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
