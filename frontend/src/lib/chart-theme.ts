/**
 * Tableau-inspired chart color palette for USG Pricing Decision Engine.
 * Based on Tableau 10 with adjustments for USG brand context.
 */

export const TABLEAU_PALETTE = [
  "#4E79A7", // Steel Blue
  "#F28E2B", // Orange
  "#E15759", // Coral Red
  "#76B7B2", // Teal
  "#59A14F", // Green
  "#EDC948", // Gold
  "#B07AA1", // Lavender
  "#FF9DA7", // Pink
  "#9C755F", // Brown
  "#BAB0AC", // Gray
];

export const SEGMENT_COLORS: Record<string, string> = {
  oro: "#D4A843",
  plata: "#8C939A",
  bronce: "#B5651D",
};

export const ACTION_COLORS: Record<string, string> = {
  increase: "#4E79A7",
  protect: "#EDC948",
  decrease: "#E15759",
};

export const CHART_COLORS = {
  primary: "#4E79A7",
  secondary: "#F28E2B",
  tertiary: "#76B7B2",
  positive: "#59A14F",
  negative: "#E15759",
  warning: "#EDC948",
  neutral: "#BAB0AC",
  revenue: "#4E79A7",
  volume: "#59A14F",
  margin: "#76B7B2",
  price: "#4E79A7",
  listPrice: "#BAB0AC",
  netPrice: "#4E79A7",
  discount: "#EDC948",
  rebate: "#E15759",
};

/** Tooltip style matching the theme */
export const tooltipStyle = {
  contentStyle: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "8px",
    boxShadow: "var(--shadow-md)",
    fontSize: "12px",
    fontFamily: "'Inter', sans-serif",
  },
  labelStyle: {
    color: "var(--text-primary)",
    fontWeight: 600,
    marginBottom: "4px",
  },
  itemStyle: {
    color: "var(--text-secondary)",
    fontSize: "12px",
  },
};

/** Axis tick style */
export const axisTickStyle = {
  fontSize: 11,
  fill: "var(--text-tertiary)",
  fontFamily: "'Inter', sans-serif",
};

/** Grid style */
export const gridStyle = {
  strokeDasharray: "3 3",
  stroke: "var(--border-secondary)",
};
