"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface ComboBoxProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string; // comma-separated values, e.g. "1,5,12"
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ComboBox({ label, options, value, onChange, placeholder = "Todos" }: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse comma-separated value into array
  const selected = value ? value.split(",").filter(Boolean) : [];

  const selectedLabels = selected
    .map((v) => options.find((o) => o.value === v))
    .filter(Boolean) as { value: string; label: string }[];

  const filtered = options.filter((o) => {
    const matchesSearch = !search || o.label.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Update dropdown position relative to trigger
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [open, updatePosition]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggleOption(val: string) {
    if (selected.includes(val)) {
      const next = selected.filter((v) => v !== val);
      onChange(next.join(","));
    } else {
      onChange([...selected, val].join(","));
    }
  }

  function removeOption(val: string) {
    const next = selected.filter((v) => v !== val);
    onChange(next.join(","));
  }

  function clearAll() {
    onChange("");
    setOpen(false);
    setSearch("");
  }

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed max-h-60 overflow-auto rounded-xl border shadow-lg"
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 9999,
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        borderColor: "var(--glass-border)",
      }}
    >
      {/* Clear all / Todos option */}
      <div
        className="cursor-pointer px-3 py-2 text-sm transition-colors hover:opacity-80"
        style={{ color: "var(--text-tertiary)" }}
        onClick={clearAll}
      >
        {placeholder} (limpiar)
      </div>
      {filtered.length === 0 ? (
        <div className="px-3 py-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Sin resultados
        </div>
      ) : (
        filtered.map((o) => {
          const isSelected = selected.includes(o.value);
          return (
            <div
              key={o.value}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-80"
              style={{
                color: "var(--text-primary)",
                background: isSelected ? "var(--bg-tertiary)" : "transparent",
              }}
              onClick={() => toggleOption(o.value)}
            >
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs"
                style={{
                  borderColor: isSelected ? "var(--usg-red)" : "var(--input-border)",
                  background: isSelected ? "var(--usg-red)" : "transparent",
                  color: isSelected ? "#fff" : "transparent",
                }}
              >
                {isSelected ? "\u2713" : ""}
              </span>
              {o.label}
            </div>
          );
        })
      )}
    </div>,
    document.body,
  ) : null;

  return (
    <div className="flex flex-col gap-1" style={{ minWidth: 160 }}>
      {label && (
        <label className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </label>
      )}
      <div
        ref={triggerRef}
        className="flex flex-wrap items-center gap-1 rounded-lg border px-2 py-1.5 cursor-pointer"
        style={{
          background: "var(--input-bg)",
          borderColor: open ? "var(--usg-red)" : "var(--input-border)",
          boxShadow: open ? "0 0 0 3px rgba(166, 25, 46, 0.1)" : "none",
          minHeight: 38,
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
        onClick={() => {
          setOpen(true);
          updatePosition();
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {/* Selected chips */}
        {selectedLabels.map((item) => (
          <span
            key={item.value}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-primary)",
            }}
          >
            {item.label.length > 20 ? item.label.slice(0, 20) + "..." : item.label}
            <button
              className="ml-0.5 hover:opacity-70"
              style={{ color: "var(--text-tertiary)" }}
              onClick={(e) => {
                e.stopPropagation();
                removeOption(item.value);
              }}
            >
              x
            </button>
          </span>
        ))}
        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          className="min-w-[60px] flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
          placeholder={selected.length === 0 ? placeholder : "Buscar..."}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) {
              setOpen(true);
              updatePosition();
            }
          }}
          onFocus={() => {
            setOpen(true);
            updatePosition();
          }}
        />
        {/* Clear all button */}
        {selected.length > 0 && (
          <button
            className="shrink-0 rounded px-1 text-xs hover:opacity-70"
            style={{ color: "var(--text-tertiary)" }}
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
            title="Limpiar todo"
          >
            x
          </button>
        )}
        <svg
          className="shrink-0"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          style={{ color: "var(--text-tertiary)" }}
        >
          <path d="M3 5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      {dropdown}
    </div>
  );
}
