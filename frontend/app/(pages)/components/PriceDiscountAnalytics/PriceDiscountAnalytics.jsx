"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Lightbulb, Percent, Tag, TrendingDown, TrendingUp } from "lucide-react";
import { useFilterStore } from "@/app/store/useFilterStore";
import { toast } from "sonner";
import { Metric, Panel, PanelHeader } from "@/components/dashboard/panel";
import { EmptyState, InsightList, Skeleton } from "@/components/dashboard/feedback";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/dashboard/data-table";
import {
  ChartFrame,
  ChartTooltip,
  barCursor,
  fmt,
  gridProps,
  useChartAnimation,
  xAxisProps,
  yAxisProps,
} from "@/components/dashboard/chart-kit";
import { cn } from "@/lib/utils";

function CategoryBars({ data, dataKey, name, formatter, tickFormatter }) {
  const animate = useChartAnimation();
  return (
    <ChartFrame height={260}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="category"
            {...xAxisProps}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={64}
          />
          <YAxis {...yAxisProps} tickFormatter={tickFormatter} />
          <Tooltip cursor={barCursor} content={<ChartTooltip valueFormatter={formatter} />} />
          <Bar
            dataKey={dataKey}
            name={name}
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            isAnimationActive={animate}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export const PriceDiscountAnalytics = () => {
  const selectedCountry = useFilterStore((state) => state.selectedCountry);
  const selectedYear = useFilterStore((state) => state.selectedYear);

  const [pricingData, setPricingData] = useState([]);
  const [discountImpactData, setDiscountImpactData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPricingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, selectedYear]);

  const fetchPricingData = async () => {
    setLoading(true);
    try {
      const pricingRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/pricing?country=${selectedCountry}&year=${selectedYear}`
      );
      const pricingJson = await pricingRes.json();
      setPricingData(pricingJson.data || []);

      const discountRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/discount-impact?country=${selectedCountry}&year=${selectedYear}`
      );
      const discountJson = await discountRes.json();
      setDiscountImpactData(discountJson.data || []);
    } catch (error) {
      toast.error("Failed to fetch pricing analytics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const insights = useMemo(() => {
    if (!discountImpactData.length) return null;
    const avg =
      discountImpactData.reduce((sum, item) => sum + item.units_lift_pct, 0) /
      discountImpactData.length;
    const best = discountImpactData.reduce((max, item) =>
      item.units_lift_pct > max.units_lift_pct ? item : max
    );
    return { avg, best };
  }, [discountImpactData]);

  if (!pricingData.length && !discountImpactData.length) {
    return loading ? (
      <div className="grid gap-4">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    ) : (
      <EmptyState icon={Tag} title="No pricing data for this scope" />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {pricingData.length > 0 ? (
        <Panel>
          <PanelHeader
            icon={Tag}
            title="Pricing and margin by category"
            description="List price, how much of it is realized after discounts, and the margin left."
          />
          <DataTable className="mt-4">
            <THead>
              <tr>
                <TH>Category</TH>
                <TH align="right">List price</TH>
                <TH align="right">Avg discount</TH>
                <TH align="right">Price realization</TH>
                <TH align="right">Margin</TH>
                <TH align="right">Total sales</TH>
                <TH align="right">Units</TH>
              </tr>
            </THead>
            <TBody>
              {pricingData.map((item) => (
                <TR key={item.category}>
                  <TD className="font-medium">{item.category}</TD>
                  <TD align="right">{fmt.money2(item.avg_list_price)}</TD>
                  <TD align="right" className="text-muted-foreground">
                    −{item.avg_discount_pct.toFixed(1)}%
                  </TD>
                  <TD align="right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="tabular-nums">
                        {(item.price_realization * 100).toFixed(1)}%
                      </span>
                      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <span
                          className="block h-full rounded-full bg-chart-1"
                          style={{ width: `${Math.min(100, item.price_realization * 100)}%` }}
                        />
                      </span>
                    </div>
                  </TD>
                  <TD align="right" className="font-medium">
                    {item.avg_margin_pct}%
                  </TD>
                  <TD align="right">{fmt.money(item.total_sales)}</TD>
                  <TD align="right" className="text-muted-foreground">
                    {fmt.int(item.total_units)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        </Panel>
      ) : null}

      {pricingData.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel>
            <PanelHeader icon={Tag} title="Average list price" />
            <div className="px-2 pb-3 pt-4 sm:px-4">
              <CategoryBars
                data={pricingData}
                dataKey="avg_list_price"
                name="List price"
                formatter={fmt.money2}
                tickFormatter={(v) => `$${v}`}
              />
            </div>
          </Panel>
          <Panel>
            <PanelHeader icon={Percent} title="Average margin" />
            <div className="px-2 pb-3 pt-4 sm:px-4">
              <CategoryBars
                data={pricingData}
                dataKey="avg_margin_pct"
                name="Margin"
                formatter={(v) => `${v}%`}
                tickFormatter={(v) => `${v}%`}
              />
            </div>
          </Panel>
        </div>
      ) : null}

      {discountImpactData.length > 0 ? (
        <Panel>
          <PanelHeader
            icon={TrendingUp}
            title="Discount effectiveness"
            description="Extra units sold when a discount is on, per category."
          />
          <div className="flex flex-col gap-5 p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {discountImpactData.map((item) => {
                const up = item.units_lift_pct > 0;
                const LiftIcon = up ? TrendingUp : TrendingDown;
                return (
                  <div key={item.category} className="flex flex-col gap-3 rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground">{item.category}</p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
                          up ? "text-good-ink" : "text-critical-ink"
                        )}
                      >
                        <LiftIcon className="size-4" aria-hidden />
                        {up ? "+" : ""}
                        {item.units_lift_pct.toFixed(1)}%
                        <span className="sr-only">unit lift</span>
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                      <Metric label="Units, discounted" value={fmt.int(item.units_with_discount)} />
                      <Metric label="Units, full price" value={fmt.int(item.units_without_discount)} />
                      <Metric label="Sales, discounted" value={fmt.money(item.sales_with_discount)} />
                      <Metric label="Sales, full price" value={fmt.money(item.sales_without_discount)} />
                    </dl>
                    <p className="border-t pt-2.5 text-xs text-muted-foreground">
                      <span className="tabular-nums">{fmt.int(item.transaction_count_discounted)}</span>{" "}
                      discounted vs{" "}
                      <span className="tabular-nums">{fmt.int(item.transaction_count_no_discount)}</span>{" "}
                      full-price transactions
                    </p>
                  </div>
                );
              })}
            </div>

            {insights ? (
              <InsightList
                icon={Lightbulb}
                title="Key insights"
                items={[
                  <>
                    Average discount lift across categories is{" "}
                    <span className="font-semibold text-foreground">
                      {insights.avg.toFixed(1)}%
                    </span>
                    .
                  </>,
                  <>
                    <span className="font-semibold text-foreground">{insights.best.category}</span>{" "}
                    responds best to discounts (
                    {insights.best.units_lift_pct > 0 ? "+" : ""}
                    {insights.best.units_lift_pct.toFixed(1)}% units).
                  </>,
                ]}
              />
            ) : null}
          </div>
        </Panel>
      ) : null}
    </div>
  );
};
