"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  History,
  FlaskConical,
  Lightbulb,
  ArrowLeftRight,
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

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-gray-50">
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
          USG
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-900">Pricing Engine</h1>
          <p className="text-[11px] text-gray-500">Decision MVP</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-6 py-4">
        <p className="text-[11px] text-gray-400">USG Pricing Decision Engine</p>
        <p className="text-[11px] text-gray-400">MVP v0.1.0</p>
      </div>
    </aside>
  );
}
