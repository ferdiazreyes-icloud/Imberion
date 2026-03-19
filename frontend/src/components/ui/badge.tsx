import { cn } from "@/lib/utils";

const variants: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  high: { bg: "rgba(5,150,105,0.1)", text: "#059669", darkBg: "rgba(5,150,105,0.2)", darkText: "#34D399" },
  medium: { bg: "rgba(217,119,6,0.1)", text: "#D97706", darkBg: "rgba(217,119,6,0.2)", darkText: "#FBBF24" },
  low: { bg: "rgba(220,38,38,0.1)", text: "#DC2626", darkBg: "rgba(220,38,38,0.2)", darkText: "#F87171" },
  increase: { bg: "rgba(78,121,167,0.1)", text: "#4E79A7", darkBg: "rgba(78,121,167,0.2)", darkText: "#7BA3CC" },
  protect: { bg: "rgba(237,201,72,0.1)", text: "#B8940A", darkBg: "rgba(237,201,72,0.2)", darkText: "#EDC948" },
  decrease: { bg: "rgba(225,87,89,0.1)", text: "#E15759", darkBg: "rgba(225,87,89,0.2)", darkText: "#FF8B8D" },
  oro: { bg: "rgba(212,168,67,0.12)", text: "#9E7C1F", darkBg: "rgba(212,168,67,0.2)", darkText: "#D4A843" },
  plata: { bg: "rgba(140,147,154,0.12)", text: "#6B757C", darkBg: "rgba(140,147,154,0.2)", darkText: "#8C939A" },
  bronce: { bg: "rgba(181,101,29,0.12)", text: "#8B5E1D", darkBg: "rgba(181,101,29,0.2)", darkText: "#B5651D" },
  default: { bg: "rgba(140,147,154,0.1)", text: "#54585A", darkBg: "rgba(140,147,154,0.2)", darkText: "#A0A8AE" },
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        className
      )}
      style={{
        background: `var(--badge-bg, ${v.bg})`,
        color: `var(--badge-text, ${v.text})`,
        ["--badge-bg" as string]: v.bg,
        ["--badge-text" as string]: v.text,
      }}
      data-variant={variant}
      {...props}
    />
  );
}
