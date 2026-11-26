"use client";

import { CountingNumber } from "@animate-ui/react/primitives/texts/counting-number";
import { cn } from "@/lib/utils";
import { Skeleton } from "./feedback";

const TONES = {
  good: "bg-good-soft text-good-ink",
  warning: "bg-warning-soft text-warning-ink",
  serious: "bg-serious-soft text-serious-ink",
  critical: "bg-critical-soft text-critical-ink",
  info: "bg-info-soft text-info-ink",
};

/**
 * Stat tile. The number counts up once when it scrolls into view
 * (Animate UI CountingNumber); units stay plain text beside it.
 */
export function KpiCard({
  label,
  value,
  prefix,
  suffix,
  decimals = 0,
  icon: Icon,
  hint,
  tone,
  className,
}) {
  const ready = typeof value === "number" && Number.isFinite(value);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "grid size-8 place-items-center rounded-lg",
              TONES[tone] ?? "bg-muted text-foreground/70"
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>

      {ready ? (
        <p className="flex items-baseline gap-0.5 text-[28px] font-semibold leading-none tracking-[-0.02em] text-foreground">
          {prefix ? (
            <span className="text-xl font-medium text-muted-foreground">
              {prefix}
            </span>
          ) : null}
          <CountingNumber
            number={value}
            decimalPlaces={decimals}
            thousandSeparator=","
            inView
            className="tabular-nums"
          />
          {suffix ? (
            <span
              className={cn(
                "font-medium text-muted-foreground",
                suffix.length > 2 ? "ml-1.5 text-base" : "ml-0.5 text-xl"
              )}
            >
              {suffix}
            </span>
          ) : null}
        </p>
      ) : (
        <Skeleton className="h-7 w-32" />
      )}

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
