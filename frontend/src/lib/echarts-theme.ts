/**
 * ECharts theme — Editorial / Lomska style
 * Clean whites, navy + coral palette, direct data labels, minimal decoration
 */

export const EDITORIAL_COLORS = {
  navy: "#2B4C7E",
  coral: "#D85A4A",
  blue: "#5B8DB8",
  gray: "#C4C9CF",
  gold: "#D4A843",
  silver: "#8C939A",
  bronze: "#B5651D",
  green: "#4A9B7F",
  amber: "#D4A843",
  text: "#1A1A2E",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  bg: "#FFFFFF",
};

export const SEGMENT_FILL: Record<string, string> = {
  oro: EDITORIAL_COLORS.gold,
  plata: EDITORIAL_COLORS.silver,
  bronce: EDITORIAL_COLORS.bronze,
};

export const ACTION_FILL: Record<string, string> = {
  increase: EDITORIAL_COLORS.navy,
  protect: EDITORIAL_COLORS.amber,
  decrease: EDITORIAL_COLORS.coral,
};

export const EDITORIAL_PALETTE = [
  EDITORIAL_COLORS.navy,
  EDITORIAL_COLORS.coral,
  EDITORIAL_COLORS.blue,
  EDITORIAL_COLORS.green,
  EDITORIAL_COLORS.amber,
  EDITORIAL_COLORS.silver,
];

/** Base ECharts theme object */
export const editorialTheme = {
  color: EDITORIAL_PALETTE,
  backgroundColor: "transparent",
  textStyle: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: EDITORIAL_COLORS.text,
  },
  title: {
    textStyle: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: 15,
      color: EDITORIAL_COLORS.text,
    },
  },
  grid: {
    containLabel: true,
    left: 12,
    right: 24,
    top: 12,
    bottom: 12,
  },
  categoryAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: {
      color: EDITORIAL_COLORS.textMuted,
      fontSize: 11,
      fontFamily: "'Inter', sans-serif",
    },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: {
      show: true,
      lineStyle: { color: EDITORIAL_COLORS.border, type: "dashed" as const },
    },
    axisLabel: {
      color: EDITORIAL_COLORS.textLight,
      fontSize: 10,
      fontFamily: "'Inter', sans-serif",
    },
  },
  tooltip: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: EDITORIAL_COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    textStyle: {
      color: EDITORIAL_COLORS.text,
      fontSize: 12,
      fontFamily: "'Inter', sans-serif",
    },
    extraCssText: "box-shadow: 0 4px 20px rgba(0,0,0,0.08);",
  },
  legend: {
    textStyle: {
      color: EDITORIAL_COLORS.textMuted,
      fontSize: 11,
      fontFamily: "'Inter', sans-serif",
    },
    icon: "circle",
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 16,
  },
};

/** Label style for direct data labels */
export const directLabel = {
  show: true,
  fontFamily: "'Inter', sans-serif",
  fontSize: 12,
  fontWeight: 600 as const,
  color: EDITORIAL_COLORS.text,
};

/** Format helpers */
export function fmtM(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export function fmtN(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
}

export function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

export function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}
