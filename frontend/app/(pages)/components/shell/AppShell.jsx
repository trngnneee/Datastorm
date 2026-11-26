"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Drawer } from "@animate-ui/react/primitives/radix-ui";
import { Button } from "@/components/ui/button";
import { Brand, DatasetCard, Sidebar, SidebarNav } from "./Sidebar";
import { LoadingBar } from "./LoadingBar";
import { ScopeSummary } from "./GlobalFilters";
import { itemByKey, resolveActiveKey } from "./nav";

function MobileNav({ activeKey }) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer.Root direction="left" open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" aria-hidden />
      </Button>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-[2px]" />
        <Drawer.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar shadow-2xl outline-none">
          <Drawer.Title className="sr-only">Navigation</Drawer.Title>
          <Drawer.Description className="sr-only">
            Choose a DataStorm section
          </Drawer.Description>
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            <Brand />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" aria-hidden />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
            <SidebarNav activeKey={activeKey} onNavigate={() => setOpen(false)} />
          </div>
          <div className="p-3">
            <DatasetCard />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function AppShell({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeKey = resolveActiveKey(pathname, searchParams.get("section"));
  const current = itemByKey(activeKey);

  return (
    <div className="min-h-dvh">
      <Sidebar activeKey={activeKey} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <MobileNav activeKey={activeKey} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground">
                DataStorm <span aria-hidden>/</span>{" "}
                <span className="text-foreground/80">{current.label}</span>
              </p>
              <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                {current.title}
              </p>
            </div>
            {current.filters ? (
              <div className="hidden md:block">
                <ScopeSummary />
              </div>
            ) : null}
          </div>
          <LoadingBar />
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
