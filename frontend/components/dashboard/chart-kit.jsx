"use client";

import { useShouldReduceMotion } from "@animate-ui/react/utils/motion";
import { cn } from "@/lib/utils";

/**
 * Chart conventions (dataviz skill):
 * - categorical hues in fixed order, assigned by entity (never by rank)
 * - one y-axis per chart, hairline solid grid, recessive axes
 * - thin marks, 4px rounded data-ends, 2px lines
 * - hover tooltip on every plot, legend for >= 2 series
 */
export const SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

/** Stable color per entity name: sort the full domain once, then index. */
export function colorMap(names) {
  const sorted = [...new Set(names)].sort((a, b) => String(a).localeCompare(String(b)));
  const map = {};
  sorted.forEach((name, i) => {
    map[name] = SERIES[Math.min(i, SERIES.length - 1)];
  });
  return map;
}

const tick = { fontSize: 12, fill: "var(--muted-foreground)" };

export const xAxisProps = {
  tick,
  tickLine: false,
  axisLine: { stroke: "var(--chart-axis)" },
  tickMargin: 8,
};

export const yAxisProps = {
  tick,
  tickLine: false,
  axisLine: false,
  tickMargin: 6,
  width: 56,
};

export const gridProps = {
  stroke: "var(--chart-grid)",
  vertical: false,
};

export const barCursor = { fill: "var(--muted)", opacity: 0.7 };
export const lineCursor = { stroke: "var(--chart-axis)", strokeWidth: 1 };

/** Recharts' own enter animation stays on unless the viewer asked for less motion. */
export function useChartAnimation() {
  return !useShouldReduceMotion();
}

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const money2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmt = {
  compact: (v) => (v == null || Number.isNaN(Number(v)) ? "—" : compact.format(Number(v))),
  int: (v) => (v == null || Number.isNaN(Number(v)) ? "—" : integer.format(Number(v))),
  money: (v) => (v == null || Number.isNaN(Number(v)) ? "—" : money.format(Number(v))),
  money2: (v) => (v == null || Number.isNaN(Number(v)) ? "—" : money2.format(Number(v))),
  moneyCompact: (v) =>
    v == null || Number.isNaN(Number(v)) ? "—" : `$${compact.format(Number(v))}`,
  pct: (v, d = 1) =>
    v == null || Number.isNaN(Number(v)) ? "—" : `${Number(v).toFixed(d)}%`,
  days: (v, d = 1) =>
    v == null || Number.isNaN(Number(v)) ? "—" : `${Number(v).toFixed(d)} d`,
  date: (v) => {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  },
};

/** Card-styled tooltip; text wears text tokens, the swatch carries identity. */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = fmt.int,
  labelFormatter,
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value != null);
  if (!rows.length) return null;
  return (
    <div className="min-w-40 rounded-xl border bg-popover px-3 py-2.5 text-xs shadow-lg">
      {label != null && label !== "" ? (
        <p className="mb-1.5 font-medium text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      ) : null}
      <ul className="space-y-1">
        {rows.map((p) => (
          <li key={`${p.dataKey}-${p.name}`} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ background: p.color || p.payload?.fill || p.fill }}
            />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums text-foreground">
              {valueFormatter(p.value, p)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartLegend({ items, className }) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn(
              "shrink-0",
              item.type === "line" ? "h-0.5 w-3.5 rounded-full" : "size-2.5 rounded-[3px]"
            )}
            style={{ background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Fixed-height plot frame; height includes the x-axis band. */
export function ChartFrame({ height = 280, className, children }) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      {children}
    </div>
  );
}
