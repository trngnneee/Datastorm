"use client";

import { useSearchParams } from "next/navigation";
import { GlobalFilters } from "../components/shell/GlobalFilters";
import { itemByKey, resolveActiveKey } from "../components/shell/nav";
import { Reveal } from "@/components/dashboard/reveal";
import { Overview } from "../components/Overview/Overview";
import { MapSection } from "../components/Map/MapSection";
import { FinancialAnalytics } from "../components/FinancialAnalytics/FinancialAnalytics";
import { TopSKUProduct } from "../components/TopSKUProduct/TopSKUProduct";
import { StockAlerts } from "../components/StockAlerts/StockAlerts";
import { DayOfCover } from "../components/DayOfCover/DayOfCover";
import { AdvancedAnalytics } from "../components/AdvancedAnalytics/AdvancedAnalytics";

const SECTIONS = {
  overview: Overview,
  map: MapSection,
  financial: FinancialAnalytics,
  "top-sku": TopSKUProduct,
  alerts: StockAlerts,
  doc: DayOfCover,
  analytics: AdvancedAnalytics,
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const activeKey = resolveActiveKey("/", searchParams.get("section"));
  const item = itemByKey(activeKey);
  const Section = SECTIONS[activeKey] ?? Overview;

  return (
    <div className="flex flex-col gap-6">
      {item.filters ? <GlobalFilters /> : null}
      <Reveal key={activeKey} surface>
        <Section />
      </Reveal>
    </div>
  );
}
