import { cn } from "@/lib/utils";

/** Surface for every dashboard block. One level deep: never nest a Panel in a Panel. */
export function Panel({ className, children, ...props }) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-card text-card-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-5 pt-5",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/[0.07] text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-6 tracking-[-0.005em] text-foreground">
            {title}
          </h3>
          {description ? (
            <p className="text-[13px] leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function PanelBody({ className, ...props }) {
  return <div className={cn("p-5", className)} {...props} />;
}

/** Page-level heading used at the top of each section. */
export function SectionHeading({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground text-balance">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Label/value pair for compact metric grids inside cards. */
export function Metric({ label, value, className, valueClassName }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-sm font-semibold tabular-nums text-foreground",
          valueClassName
        )}
      >
        {value}
      </dd>
    </div>
  );
}
