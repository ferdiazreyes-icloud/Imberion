"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatNumber, formatCurrency } from "@/lib/utils";

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
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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

export function KPICard({ label, value, unit, change_pct, icon }: KPICardProps) {
  const animatedValue = useCountUp(value);
  const displayValue = unit === "MXN"
    ? formatCurrency(animatedValue)
    : `${formatNumber(animatedValue, unit === "%" ? 1 : 0)}${unit ? ` ${unit}` : ""}`;

  return (
    <Card className="p-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</p>
        {icon && <span style={{ color: "var(--text-tertiary)" }}>{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold animate-count-up" style={{ color: "var(--text-primary)" }}>
        {displayValue}
      </p>
      {change_pct !== undefined && change_pct !== null && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              background: change_pct >= 0 ? "var(--positive-bg)" : "var(--negative-bg)",
              color: change_pct >= 0 ? "var(--positive)" : "var(--negative)",
            }}
          >
            {change_pct >= 0 ? "+" : ""}{change_pct.toFixed(1)}%
          </span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>vs período anterior</span>
        </div>
      )}
    </Card>
  );
}
