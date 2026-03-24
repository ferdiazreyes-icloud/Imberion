"use client";

import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  return (
    <div
      className="px-4 py-3"
      style={{ borderTop: "1px solid var(--border-primary)" }}
    >
      <div
        className="flex items-end gap-2 rounded-xl px-3 py-2"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Pregunta sobre tus datos..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
          style={{ color: "var(--text-primary)", maxHeight: "120px" }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all"
          style={{
            background: text.trim() && !disabled ? "var(--gradient-accent)" : "var(--border-secondary)",
            cursor: text.trim() && !disabled ? "pointer" : "not-allowed",
          }}
        >
          <Send size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
}
