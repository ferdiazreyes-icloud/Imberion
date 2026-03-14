import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-red-100 text-red-800",
  increase: "bg-blue-100 text-blue-800",
  protect: "bg-amber-100 text-amber-800",
  decrease: "bg-red-100 text-red-800",
  oro: "bg-yellow-100 text-yellow-800",
  plata: "bg-gray-100 text-gray-700",
  bronce: "bg-orange-100 text-orange-800",
  default: "bg-gray-100 text-gray-800",
};

export function Badge({ variant = "default", className, ...props }: {
  variant?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}
