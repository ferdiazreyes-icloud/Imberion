import { cn } from "@/lib/utils";

// Editorial palette: navy, coral, gray only
const navy = "#2B4C7E";
const coral = "#D85A4A";
const gray = "#8C939A";

const variants: Record<string, { bg: string; text: string }> = {
  high:     { bg: `rgba(43,76,126,0.1)`,  text: navy },
  medium:   { bg: `rgba(140,147,154,0.1)`, text: gray },
  low:      { bg: `rgba(216,90,74,0.1)`,  text: coral },
  increase: { bg: `rgba(43,76,126,0.1)`,  text: navy },
  protect:  { bg: `rgba(140,147,154,0.1)`, text: gray },
  decrease: { bg: `rgba(216,90,74,0.1)`,  text: coral },
  oro:      { bg: "transparent", text: "#6B7280" },
  plata:    { bg: "transparent", text: "#6B7280" },
  bronce:   { bg: "transparent", text: "#6B7280" },
  default:  { bg: `rgba(140,147,154,0.08)`, text: gray },
};

export function Badge({ variant = "default", className, ...props }: {
  variant?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const v = variants[variant] || variants.default;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        className
      )}
      style={{
        background: v.bg,
        color: v.text,
      }}
      data-variant={variant}
      {...props}
    />
  );
}

/** Dot indicator for confidence levels */
const DOT_COLORS: Record<string, string> = { high: navy, medium: gray, low: coral };

export function ConfidenceDot({ level }: { level: string }) {
  const color = DOT_COLORS[level] || gray;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: "#4B5563" }}>
      <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
      {level}
    </span>
  );
}

/** Segment label with emoji */
const SEGMENT_ICONS: Record<string, string> = { oro: "🥇", plata: "🥈", bronce: "🥉" };

export function SegmentLabel({ segment }: { segment: string }) {
  return (
    <span className="text-[12px]" style={{ color: "#4B5563" }}>
      {SEGMENT_ICONS[segment] || ""} {segment}
    </span>
  );
}
