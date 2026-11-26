import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-muted motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing to show yet",
  description,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/40 px-6 py-10 text-center",
        className
      )}
    >
      <span className="grid size-10 place-items-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-[13px] text-muted-foreground text-pretty">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}

const STATUS = {
  good: { icon: CheckCircle2, className: "bg-good-soft text-good-ink" },
  warning: { icon: Clock, className: "bg-warning-soft text-warning-ink" },
  serious: { icon: AlertTriangle, className: "bg-serious-soft text-serious-ink" },
  critical: { icon: AlertOctagon, className: "bg-critical-soft text-critical-ink" },
  info: { icon: Info, className: "bg-info-soft text-info-ink" },
  neutral: { icon: null, className: "bg-muted text-foreground/80" },
};

/** State badge: always icon + label, never color alone. */
export function StatusBadge({ status = "neutral", icon, children, className }) {
  const conf = STATUS[status] ?? STATUS.neutral;
  const Icon = icon === null ? null : (icon ?? conf.icon);
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-xs font-medium",
        conf.className,
        className
      )}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
      {children}
    </span>
  );
}

/** Insight list with an icon marker per row (replaces emoji bullets). */
export function InsightList({ title, items, icon: Icon = Info }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4 text-primary" aria-hidden />
        {title}
      </p>
      <ul className="space-y-1.5 text-[13px] leading-5 text-muted-foreground">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span
              aria-hidden
              className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
