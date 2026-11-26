"use client";

import { useState } from "react";
import { CloudSun, PackageSearch, Store, Tags, Truck } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsTrigger,
} from "@animate-ui/react/primitives/tabs";
import { cn } from "@/lib/utils";
import { ChannelAnalytics } from "../ChannelAnalytics/ChannelAnalytics";
import { PriceDiscountAnalytics } from "../PriceDiscountAnalytics/PriceDiscountAnalytics";
import { SupplierPerformance } from "../SupplierPerformance/SupplierPerformance";
import { InventoryOptimization } from "../InventoryOptimization/InventoryOptimization";
import { WeatherCorrelation } from "../WeatherCorrelation/WeatherCorrelation";

const TABS = [
  { value: "channels", label: "Channels", icon: Store, Component: ChannelAnalytics },
  { value: "pricing", label: "Pricing & discounts", icon: Tags, Component: PriceDiscountAnalytics },
  { value: "suppliers", label: "Suppliers", icon: Truck, Component: SupplierPerformance },
  { value: "inventory", label: "Inventory", icon: PackageSearch, Component: InventoryOptimization },
  { value: "weather", label: "Weather", icon: CloudSun, Component: WeatherCorrelation },
];

/**
 * Five deep-dive views behind Animate UI Tabs: one highlight glides between
 * triggers, panels hand over with a short fade. A view mounts (and fetches)
 * the first time it is opened, then stays mounted.
 */
export const AdvancedAnalytics = () => {
  const [tab, setTab] = useState(TABS[0].value);
  const [visited, setVisited] = useState(() => new Set([TABS[0].value]));

  const onChange = (value) => {
    setTab(value);
    setVisited((prev) => (prev.has(value) ? prev : new Set(prev).add(value)));
  };

  return (
    <Tabs value={tab} onValueChange={onChange} className="flex flex-col gap-5">
      <div className="-mx-1 overflow-x-auto px-1 pb-1 scroll-thin">
        <TabsHighlight className="absolute inset-0 z-0 rounded-lg bg-card shadow-sm ring-1 ring-border/80">
          <TabsList className="inline-flex items-center gap-0.5 rounded-xl bg-muted p-1">
            {TABS.map((t) => (
              <TabsHighlightItem key={t.value} value={t.value}>
                <TabsTrigger
                  value={t.value}
                  className={cn(
                    "relative z-10 inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-[13px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/40",
                    tab === t.value
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon className="size-4" aria-hidden />
                  {t.label}
                </TabsTrigger>
              </TabsHighlightItem>
            ))}
          </TabsList>
        </TabsHighlight>
      </div>

      <TabsContents>
        {TABS.map(({ value, Component }) => (
          <TabsContent key={value} value={value}>
            {visited.has(value) ? <Component /> : <div className="h-40" />}
          </TabsContent>
        ))}
      </TabsContents>
    </Tabs>
  );
};
