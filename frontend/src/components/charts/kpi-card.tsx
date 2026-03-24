"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: number;
  unit?: string;
  change_pct?: number;
  icon?: React.ReactNode;
  accentColor?: string;
}

function useCountUp(target: number, duration = 1200) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (ref.current !== null) cancelAnimationFrame(ref.current);
    const start = performance.now();
    const startVal = 0;

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(startVal + (target - startVal) * eased);
      if (progress < 1) {
        ref.current = requestAnimationFrame(step);
      }
    }

    ref.current = requestAnimationFrame(step);
    return () => {
      if (ref.current !== null) cancelAnimationFrame(ref.current);
    };
  }, [target, duration]);

  return current;
}

function formatCompact(value: number, unit?: string): string {
  if (unit === "MXN") {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  }
  if (unit === "%") return `${formatNumber(value, 1)}%`;
  if (!unit) return formatNumber(value, Math.abs(value) < 10 ? 2 : 0);
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${formatNumber(value, 0)}`;
}

function getUnitLabel(value: number, unit?: string): string | null {
  if (!unit || unit === "MXN" || unit === "%") return null;
  if (Math.abs(value) >= 1_000_000) return unit;
  if (Math.abs(value) >= 10_000) return unit;
  return unit;
}

export function KPICard({ label, value, unit, change_pct, icon, accentColor }: KPICardProps) {
  const animatedValue = useCountUp(value);
  const displayValue = formatCompact(animatedValue, unit);
  const unitLabel = getUnitLabel(value, unit);
  const accent = accentColor || "var(--usg-red)";

  return (
    <div className="p-4 animate-fade-in-up flex flex-col justify-between h-full">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: accent }} />
        <p className="text-[10px] sm:text-[11px] font-medium leading-tight" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      </div>
      <div className="mt-auto pt-2 flex items-baseline gap-1 min-w-0">
        <p className="text-lg sm:text-xl lg:text-2xl font-bold animate-count-up leading-none" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
          {displayValue}
        </p>
        {unitLabel && (
          <span className="text-[10px] sm:text-xs font-medium shrink-0" style={{ color: "var(--text-tertiary)" }}>{unitLabel}</span>
        )}
      </div>
      {change_pct !== undefined && change_pct !== null && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0"
            style={{
              background: change_pct >= 0 ? "var(--positive-bg)" : "var(--negative-bg)",
              color: change_pct >= 0 ? "var(--positive)" : "var(--negative)",
            }}
          >
            {change_pct >= 0 ? "▲" : "▼"} {change_pct >= 0 ? "+" : ""}{change_pct.toFixed(1)}%
          </span>
          <span className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>vs anterior</span>
        </div>
      )}
    </div>
  );
}
