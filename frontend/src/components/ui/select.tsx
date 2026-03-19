import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </label>
      )}
      <select
        className={cn(
          "rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2",
          className
        )}
        style={{
          background: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
        {...props}
      >
        <option value="">{placeholder || "Todos"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
