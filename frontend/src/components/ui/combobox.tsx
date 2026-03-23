"use client";

import { useState, useRef, useEffect } from "react";

interface ComboBoxProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ComboBox({ label, options, value, onChange, placeholder = "Todos" }: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="relative flex flex-col gap-1" ref={ref}>
      {label && (
        <label className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </label>
      )}
      <div
        className="flex items-center rounded-lg border transition-colors cursor-pointer"
        style={{
          background: "var(--input-bg)",
          borderColor: open ? "var(--accent-primary)" : "var(--input-border)",
        }}
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
          placeholder={value ? selectedLabel : placeholder}
          value={open ? search : selectedLabel}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {value && (
          <button
            className="mr-1 rounded px-1 text-xs hover:opacity-70"
            style={{ color: "var(--text-tertiary)" }}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect("");
            }}
            title="Limpiar"
          >
            ✕
          </button>
        )}
        <svg
          className="mr-2 shrink-0"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          style={{ color: "var(--text-tertiary)" }}
        >
          <path d="M3 5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border shadow-lg"
          style={{
            background: "var(--bg-primary)",
            borderColor: "var(--border-primary)",
          }}
        >
          <div
            className="cursor-pointer px-3 py-2 text-sm transition-colors hover:opacity-80"
            style={{ color: "var(--text-tertiary)" }}
            onClick={() => handleSelect("")}
          >
            {placeholder}
          </div>
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
              Sin resultados
            </div>
          ) : (
            filtered.map((o) => (
              <div
                key={o.value}
                className="cursor-pointer px-3 py-2 text-sm transition-colors hover:opacity-80"
                style={{
                  color: "var(--text-primary)",
                  background: o.value === value ? "var(--bg-tertiary)" : "transparent",
                }}
                onClick={() => handleSelect(o.value)}
              >
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
