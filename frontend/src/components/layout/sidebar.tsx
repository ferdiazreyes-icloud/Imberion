"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import {
  LayoutDashboard,
  History,
  FlaskConical,
  Lightbulb,
  ArrowLeftRight,
  Sun,
  Moon,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/history", label: "Historial", icon: History },
  { href: "/simulator", label: "Simulador", icon: FlaskConical },
  { href: "/recommendations", label: "Recomendaciones", icon: Lightbulb },
  { href: "/passthrough", label: "Passthrough", icon: ArrowLeftRight },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      className="flex h-screen w-64 flex-col"
      style={{ background: "var(--gradient-sidebar)" }}
    >
      {/* USG Logo & Title */}
      <div
        className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm text-white"
          style={{
            background: "var(--gradient-accent)",
            boxShadow: "var(--shadow-glow-red)",
          }}
        >
          USG
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">Pricing Engine</h1>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>Decision MVP</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              )}
              style={isActive ? {
                background: "rgba(166, 25, 46, 0.2)",
                borderLeft: "3px solid rgba(255,255,255,0.9)",
                paddingLeft: "9px",
              } : {
                borderLeft: "3px solid transparent",
                paddingLeft: "9px",
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:text-white hover:bg-white/5"
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          {theme === "light" ? "Modo oscuro" : "Modo claro"}
        </button>
      </div>

      {/* Footer */}
      <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          USG Pricing Decision Engine
        </p>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>MVP v0.2.0</p>
      </div>
    </aside>
  );
}
