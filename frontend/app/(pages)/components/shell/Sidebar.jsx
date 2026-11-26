"use client";

import Link from "next/link";
import { CloudLightning, Database } from "lucide-react";
import {
  Highlight,
  HighlightItem,
} from "@animate-ui/react/primitives/effects/highlight";
import { useMotionTokens } from "@animate-ui/react/utils/motion";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, hrefFor } from "./nav";

export function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <CloudLightning className="size-[18px]" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
          DataStorm
        </p>
        <p className="text-xs text-muted-foreground">Retail intelligence</p>
      </div>
    </div>
  );
}

/**
 * One surface glides to the active page (Animate UI Highlight on
 * `spring.selection`); labels sit above it on z-10.
 */
export function SidebarNav({ activeKey, onNavigate }) {
  const { spring } = useMotionTokens();

  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      <Highlight
        controlledItems
        value={activeKey}
        hover={false}
        click={false}
        transition={spring.selection}
        className="inset-0 rounded-lg bg-primary/[0.08] ring-1 ring-primary/10"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = item.key === activeKey;
              const Icon = item.icon;
              return (
                <HighlightItem key={item.key} value={item.key}>
                  <Link
                    href={hrefFor(item)}
                    scroll={false}
                    prefetch
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative z-10 flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/40",
                      active
                        ? "font-medium text-primary"
                        : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </HighlightItem>
              );
            })}
          </div>
        ))}
      </Highlight>
    </nav>
  );
}

export function DatasetCard() {
  return (
    <div className="rounded-xl border bg-muted/50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Database className="size-3.5 text-muted-foreground" aria-hidden />
        FMCG dataset
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Daily sales, stock and weather, Jan 2021 – Dec 2023. Forecasts run
        from Jan 2024.
      </p>
    </div>
  );
}

export function Sidebar({ activeKey }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 shrink-0 items-center px-4">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2 scroll-thin">
        <SidebarNav activeKey={activeKey} />
      </div>
      <div className="shrink-0 p-3">
        <DatasetCard />
      </div>
    </aside>
  );
}
