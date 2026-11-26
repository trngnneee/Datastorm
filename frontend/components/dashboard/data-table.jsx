import { cn } from "@/lib/utils";

/** Dense, readable table: sticky header, right-aligned numbers, tabular figures. */
export function DataTable({ className, maxHeight, children }) {
  return (
    <div
      className={cn("relative w-full overflow-auto scroll-thin", className)}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className="w-full min-w-max border-separate border-spacing-0 text-[13px]">
        {children}
      </table>
    </div>
  );
}

export function THead({ children }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TH({ align = "left", className, children, ...props }) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-10 whitespace-nowrap border-b bg-card/95 px-3 py-2.5 text-xs font-medium text-muted-foreground backdrop-blur first:pl-5 last:pr-5",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TR({ className, children, ...props }) {
  return (
    <tr
      className={cn(
        "transition-colors duration-150 hover:bg-muted/60 [&:last-child>td]:border-b-0",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TD({ align = "left", mono, className, children, ...props }) {
  return (
    <td
      className={cn(
        "whitespace-nowrap border-b border-border/70 px-3 py-2.5 text-foreground/90 first:pl-5 last:pr-5",
        align === "right"
          ? "text-right tabular-nums"
          : align === "center"
            ? "text-center"
            : "text-left",
        mono && "font-mono text-xs text-foreground/80",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/** Inline magnitude bar for a table cell (single series → chart-1). */
export function CellBar({ value, max, color = "var(--chart-1)", label }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="flex min-w-32 items-center justify-end gap-2">
      <span className="tabular-nums">{label}</span>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span
          className="block h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </span>
    </div>
  );
}
