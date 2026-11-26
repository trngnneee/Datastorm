"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertOctagon,
  BarChart3,
  CheckCircle2,
  Clock,
  Lightbulb,
  PackageSearch,
  ScatterChart as ScatterIcon,
} from "lucide-react";
import { useFilterStore } from "@/app/store/useFilterStore";
import { toast } from "sonner";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { EmptyState, InsightList, Skeleton, StatusBadge } from "@/components/dashboard/feedback";
import { SegmentedControl } from "@/components/dashboard/segmented-control";
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

const PRIORITY = {
  High: { status: "critical", label: "Order now" },
  Medium: { status: "warning", label: "Plan" },
  Low: { status: "good", label: "Optimal" },
};

export const InventoryOptimization = () => {
  const selectedCountry = useFilterStore((state) => state.selectedCountry);
  const selectedYear = useFilterStore((state) => state.selectedYear);

  const [inventoryData, setInventoryData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const animate = useChartAnimation();

  useEffect(() => {
    fetchInventoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, selectedYear]);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/inventory-optimization?country=${selectedCountry}&year=${selectedYear}`
      );
      const json = await res.json();
      setInventoryData(json.data || []);
      setSummary(json.summary || null);
    } catch (error) {
      toast.error("Failed to fetch inventory data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData =
    filter === "high"
      ? inventoryData.filter((i) => i.priority === "High")
      : filter === "medium"
        ? inventoryData.filter((i) => i.priority === "Medium")
        : filter === "optimal"
          ? inventoryData.filter((i) => i.priority === "Low")
          : inventoryData;

  const stats = useMemo(() => {
    if (!inventoryData.length) return null;
    return {
      avgDays:
        inventoryData.reduce((sum, i) => sum + i.days_of_stock, 0) / inventoryData.length,
      overstock: inventoryData.filter((i) => i.days_of_stock > 30).length,
    };
  }, [inventoryData]);

  const scatterData = inventoryData.slice(0, 100);
  const scatterMax = scatterData.length
    ? Math.max(...scatterData.map((i) => Math.max(i.reorder_point, i.current_stock)))
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          label="Order now"
          value={summary ? summary.high_priority_count : null}
          icon={AlertOctagon}
          tone="critical"
          hint="Below reorder point"
        />
        <KpiCard
          label="Plan replenishment"
          value={summary ? summary.medium_priority_count : null}
          icon={Clock}
          tone="warning"
          hint="Approaching reorder point"
        />
        <KpiCard
          label="Optimal stock"
          value={summary ? summary.optimal_count : null}
          icon={CheckCircle2}
          tone="good"
          hint="Well stocked"
        />
      </div>

      <Panel>
        <PanelHeader
          icon={PackageSearch}
          title="Stock status and recommendations"
          description="Each SKU-store with its stock position and what to do next."
          actions={
            <SegmentedControl
              ariaLabel="Filter by priority"
              value={filter}
              onValueChange={setFilter}
              size="sm"
              options={[
                { value: "all", label: "All", count: inventoryData.length || null },
                { value: "high", label: "High", count: summary?.high_priority_count ?? null },
                { value: "medium", label: "Medium", count: summary?.medium_priority_count ?? null },
                { value: "optimal", label: "Optimal", count: summary?.optimal_count ?? null },
              ]}
            />
          }
        />
        {filteredData.length > 0 ? (
          <DataTable className="mt-4" maxHeight={460}>
            <THead>
              <tr>
                <TH>Product</TH>
                <TH>Status</TH>
                <TH align="right">On hand</TH>
                <TH align="right">Safety</TH>
                <TH align="right">Reorder pt</TH>
                <TH align="right">Days of stock</TH>
                <TH align="right">Daily sales</TH>
                <TH align="right">Lead time</TH>
              </tr>
            </THead>
            <TBody>
              {filteredData.map((item) => {
                const p = PRIORITY[item.priority] ?? { status: "neutral", label: item.recommendation };
                return (
                  <TR key={`${item.sku_id}-${item.store_id}`}>
                    <TD>
                      <p className="max-w-56 truncate font-medium text-foreground">{item.sku_name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {item.sku_id} · {item.store_id}
                      </p>
                    </TD>
                    <TD>
                      <StatusBadge status={p.status}>{p.label}</StatusBadge>
                    </TD>
                    <TD align="right" className="font-semibold">
                      {fmt.int(item.current_stock)}
                    </TD>
                    <TD align="right">{fmt.int(item.safety_stock)}</TD>
                    <TD align="right">{fmt.int(item.reorder_point)}</TD>
                    <TD align="right">{item.days_of_stock}</TD>
                    <TD align="right">{item.avg_daily_sales}</TD>
                    <TD align="right">{item.lead_time_days} d</TD>
                  </TR>
                );
              })}
            </TBody>
          </DataTable>
        ) : (
          <div className="p-5">
            {loading ? (
              <Skeleton className="h-72" />
            ) : (
              <EmptyState
                icon={PackageSearch}
                title="No items match this filter"
                description="Pick another priority, or widen the country and year."
              />
            )}
          </div>
        )}
      </Panel>

      {inventoryData.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel>
            <PanelHeader
              icon={ScatterIcon}
              title="On hand vs reorder point"
              description="Below the dashed line = under the reorder point. First 100 items."
            />
            <div className="px-2 pb-3 pt-4 sm:px-4">
              <ChartFrame height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                    <CartesianGrid stroke="var(--chart-grid)" />
                    <XAxis
                      dataKey="reorder_point"
                      name="Reorder point"
                      type="number"
                      {...xAxisProps}
                      label={{ value: "Reorder point", position: "insideBottom", offset: -4, fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis
                      dataKey="current_stock"
                      name="On hand"
                      type="number"
                      {...yAxisProps}
                    />
                    <Tooltip
                      cursor={{ stroke: "var(--chart-axis)", strokeDasharray: "0" }}
                      content={<ChartTooltip valueFormatter={(v) => fmt.int(v)} />}
                    />
                    <ReferenceLine
                      segment={[
                        { x: 0, y: 0 },
                        { x: scatterMax, y: scatterMax },
                      ]}
                      stroke="var(--chart-axis)"
                      strokeDasharray="4 4"
                      ifOverflow="extendDomain"
                    />
                    <Scatter
                      name="Items"
                      data={scatterData}
                      fill="var(--chart-1)"
                      fillOpacity={0.75}
                      stroke="var(--card)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartFrame>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              icon={BarChart3}
              title="Days of stock"
              description="First 15 items."
            />
            <div className="px-2 pb-3 pt-4 sm:px-4">
              <ChartFrame height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryData.slice(0, 15)} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis
                      dataKey="sku_id"
                      {...xAxisProps}
                      interval={0}
                      angle={-40}
                      textAnchor="end"
                      height={64}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis {...yAxisProps} />
                    <Tooltip
                      cursor={barCursor}
                      content={<ChartTooltip valueFormatter={(v) => `${Number(v).toFixed(1)} days`} />}
                    />
                    <Bar
                      dataKey="days_of_stock"
                      name="Days of stock"
                      fill="var(--chart-1)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                      isAnimationActive={animate}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </div>
          </Panel>
        </div>
      ) : null}

      {stats && summary ? (
        <InsightList
          icon={Lightbulb}
          title="Optimization insights"
          items={[
            <>
              <span className="font-semibold text-foreground">
                {summary.high_priority_count} items
              </span>{" "}
              need ordering now to avoid stock-outs.
            </>,
            <>
              Average days of stock is{" "}
              <span className="font-semibold text-foreground">{stats.avgDays.toFixed(1)}</span>{" "}
              days.
            </>,
            <>
              <span className="font-semibold text-foreground">{stats.overstock}</span> items hold
              more than 30 days of stock (possible overstock).
            </>,
          ]}
        />
      ) : null}
    </div>
  );
};
