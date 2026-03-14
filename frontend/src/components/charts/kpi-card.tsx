import { Card } from "@/components/ui/card";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: number;
  unit?: string;
  change_pct?: number;
  icon?: React.ReactNode;
}

export function KPICard({ label, value, unit, change_pct, icon }: KPICardProps) {
  const formatted = unit === "MXN" ? formatCurrency(value) : `${formatNumber(value, unit === "%" ? 1 : 0)}${unit ? ` ${unit}` : ""}`;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{formatted}</p>
      {change_pct !== undefined && change_pct !== null && (
        <p className={`mt-1 text-xs font-medium ${change_pct >= 0 ? "text-green-600" : "text-red-600"}`}>
          {change_pct >= 0 ? "+" : ""}{change_pct.toFixed(1)}% vs período anterior
        </p>
      )}
    </Card>
  );
}
