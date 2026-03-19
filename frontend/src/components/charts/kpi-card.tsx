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

export function KPICard({ label, value, unit, change_pct, icon }: KPICardProps) {
  const animatedValue = useCountUp(value);
  const displayValue = formatCompact(animatedValue, unit);
  const unitLabel = getUnitLabel(value, unit);

  return (
    <Card className="p-5 animate-fade-in-up overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium truncate" style={{ color: "var(--text-tertiary)" }}>{label}</p>
        {icon && <span style={{ color: "var(--text-tertiary)" }}>{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5 min-w-0">
        <p className="text-2xl font-bold truncate animate-count-up" style={{ color: "var(--text-primary)" }}>
          {displayValue}
        </p>
        {unitLabel && (
          <span className="text-xs font-medium shrink-0" style={{ color: "var(--text-tertiary)" }}>{unitLabel}</span>
        )}
      </div>
      {change_pct !== undefined && change_pct !== null && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold shrink-0"
            style={{
              background: change_pct >= 0 ? "var(--positive-bg)" : "var(--negative-bg)",
              color: change_pct >= 0 ? "var(--positive)" : "var(--negative)",
            }}
          >
            {change_pct >= 0 ? "+" : ""}{change_pct.toFixed(1)}%
          </span>
          <span className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>vs anterior</span>
        </div>
      )}
    </Card>
  );
}
