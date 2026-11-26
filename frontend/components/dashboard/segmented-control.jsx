"use client";

import {
  Highlight,
  HighlightItem,
} from "@animate-ui/react/primitives/effects/highlight";
import { useMotionTokens } from "@animate-ui/react/utils/motion";
import { cn } from "@/lib/utils";

/**
 * Single-select filter for one list (not page tabs). One surface glides to the
 * selected option on `spring.selection` (Animate UI Highlight).
 */
export function SegmentedControl({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
  size = "md",
}) {
  const { spring } = useMotionTokens();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl bg-muted p-1 scroll-thin",
        className
      )}
    >
      <Highlight
        controlledItems
        value={value}
        click={false}
        hover={false}
        transition={spring.selection}
        className="inset-0 rounded-lg bg-card shadow-sm ring-1 ring-border/80"
      >
        {options.map((opt) => {
          const selected = value === opt.value;
          const Icon = opt.icon;
          return (
            <HighlightItem key={opt.value} value={opt.value}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onValueChange(opt.value)}
                className={cn(
                  "relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/50",
                  size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
                  selected
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
                {opt.label}
                {opt.count != null ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[11px] tabular-nums",
                      selected ? "bg-muted text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {opt.count}
                  </span>
                ) : null}
              </button>
            </HighlightItem>
          );
        })}
      </Highlight>
    </div>
  );
}
