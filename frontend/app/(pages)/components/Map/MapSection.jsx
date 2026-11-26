"use client";

import { MapPinned } from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { MainMap } from "./MainMap";
import { MapLegend } from "./MapLegend";

export const MapSection = () => {
  return (
    <Panel>
      <PanelHeader
        icon={MapPinned}
        title="Net sales and stock-out rate by store"
        description="Each circle is a store: size is net sales, color is the share of days out of stock."
      />
      <div className="p-3 sm:p-5">
        <div className="relative h-[min(68vh,620px)] min-h-[420px] overflow-hidden rounded-xl border bg-muted">
          <div
            aria-hidden
            className="absolute inset-0 grid place-items-center text-[13px] text-muted-foreground [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:40px_40px]"
          >
            Loading store locations…
          </div>
          <div className="absolute inset-0">
            <MainMap />
          </div>
          <MapLegend />
        </div>
      </div>
    </Panel>
  );
};
