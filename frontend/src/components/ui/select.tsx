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
          "rounded-lg border px-3 py-2 text-sm focus:outline-none",
          className
        )}
        style={{
          background: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--usg-red)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(166, 25, 46, 0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--input-border)";
          e.currentTarget.style.boxShadow = "none";
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
