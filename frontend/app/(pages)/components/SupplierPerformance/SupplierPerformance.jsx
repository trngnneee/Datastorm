"use client";

import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Clock, DollarSign, Package, Trophy, Truck, Wallet } from "lucide-react";
import { useFilterStore } from "@/app/store/useFilterStore";
import { toast } from "sonner";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { EmptyState, Skeleton, StatusBadge } from "@/components/dashboard/feedback";
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

function RankBars({ data, dataKey, name, formatter, tickFormatter }) {
  const animate = useChartAnimation();
  return (
    <ChartFrame height={Math.max(240, data.length * 30 + 40)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
          barCategoryGap={6}
        >
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" {...xAxisProps} tickFormatter={tickFormatter} />
          <YAxis
            type="category"
            dataKey="supplier_id"
            {...yAxisProps}
            width={72}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
          />
          <Tooltip cursor={barCursor} content={<ChartTooltip valueFormatter={formatter} />} />
          <Bar
            dataKey={dataKey}
            name={name}
            fill="var(--chart-1)"
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            isAnimationActive={animate}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function marginStatus(margin) {
  if (margin > 25) return { status: "good", label: "Healthy" };
  if (margin > 15) return { status: "warning", label: "Thin" };
  return { status: "critical", label: "Low" };
}

export const SupplierPerformance = () => {
  const selectedCountry = useFilterStore((state) => state.selectedCountry);
  const selectedYear = useFilterStore((state) => state.selectedYear);

  const [supplierData, setSupplierData] = useState([]);
  const [loading, setLoading] = useState(false);
  const animate = useChartAnimation();

  useEffect(() => {
    fetchSupplierData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, selectedYear]);

  const fetchSupplierData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/supplier?country=${selectedCountry}&year=${selectedYear}`
      );
      const json = await res.json();
      setSupplierData((json.data || []).sort((a, b) => b.total_sales - a.total_sales));
    } catch (error) {
      toast.error("Failed to fetch supplier analytics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalSuppliers = supplierData.length;
  const totalCost = supplierData.reduce((sum, s) => sum + s.total_cost, 0);
  const totalProfit = supplierData.reduce((sum, s) => sum + s.profit, 0);
  const avgLeadTime = totalSuppliers
    ? supplierData.reduce((sum, s) => sum + s.avg_lead_time_days, 0) / totalSuppliers
    : 0;

  const byProfit = [...supplierData].sort((a, b) => b.profit - a.profit).slice(0, 10);
  const top10 = supplierData.slice(0, 10);
  const ready = supplierData.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active suppliers" value={ready ? totalSuppliers : null} icon={Package} />
        <KpiCard
          label="Total profit"
          prefix="$"
          value={ready ? totalProfit / 1_000_000 : null}
          decimals={1}
          suffix="M"
          icon={DollarSign}
        />
        <KpiCard
          label="Avg lead time"
          value={ready ? avgLeadTime : null}
          decimals={1}
          suffix="days"
          icon={Clock}
        />
        <KpiCard
          label="Total cost"
          prefix="$"
          value={ready ? totalCost / 1_000_000 : null}
          decimals={1}
          suffix="M"
          icon={Wallet}
        />
      </div>

      <Panel>
        <PanelHeader
          icon={Truck}
          title="Supplier scorecard"
          description="Sorted by total sales. Margin status: healthy above 25%, thin above 15%."
        />
        {ready ? (
          <DataTable className="mt-4" maxHeight={440}>
            <THead>
              <tr>
                <TH>Supplier</TH>
                <TH align="right">Products</TH>
                <TH align="right">Units</TH>
                <TH align="right">Total cost</TH>
                <TH align="right">Total sales</TH>
                <TH align="right">Profit</TH>
                <TH align="right">Lead time</TH>
                <TH align="right">Cost / unit</TH>
                <TH align="right">Margin</TH>
              </tr>
            </THead>
            <TBody>
              {supplierData.map((s) => {
                const margin = (s.profit / s.total_sales) * 100;
                const { status, label } = marginStatus(margin);
                return (
                  <TR key={s.supplier_id}>
                    <TD mono className="font-medium text-foreground">
                      {s.supplier_id}
                    </TD>
                    <TD align="right">{s.products_supplied}</TD>
                    <TD align="right">{fmt.int(s.total_units)}</TD>
                    <TD align="right" className="text-muted-foreground">
                      {fmt.money(s.total_cost)}
                    </TD>
                    <TD align="right" className="font-medium">
                      {fmt.money(s.total_sales)}
                    </TD>
                    <TD
                      align="right"
                      className={s.profit > 0 ? "text-good-ink" : "text-critical-ink"}
                    >
                      {fmt.money(s.profit)}
                    </TD>
                    <TD align="right">{fmt.days(s.avg_lead_time_days)}</TD>
                    <TD align="right">{fmt.money2(s.cost_per_unit)}</TD>
                    <TD align="right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="tabular-nums">{margin.toFixed(1)}%</span>
                        <StatusBadge status={status}>{label}</StatusBadge>
                      </div>
                    </TD>
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
              <EmptyState icon={Truck} title="No supplier data available" />
            )}
          </div>
        )}
      </Panel>

      {ready ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel>
            <PanelHeader icon={Trophy} title="Top 10 suppliers by profit" />
            <div className="px-2 pb-3 pt-4 sm:px-4">
              <RankBars
                data={byProfit}
                dataKey="profit"
                name="Profit"
                formatter={fmt.money}
                tickFormatter={fmt.moneyCompact}
              />
            </div>
          </Panel>
          <Panel>
            <PanelHeader
              icon={Clock}
              title="Lead time"
              description="Top 10 suppliers by sales."
            />
            <div className="px-2 pb-3 pt-4 sm:px-4">
              <RankBars
                data={top10}
                dataKey="avg_lead_time_days"
                name="Lead time"
                formatter={(v) => `${Number(v).toFixed(1)} days`}
                tickFormatter={(v) => `${v}d`}
              />
            </div>
          </Panel>
        </div>
      ) : null}

      {ready ? (
        <Panel>
          <PanelHeader
            icon={DollarSign}
            title="Cost per unit"
            description="Top 12 suppliers by sales."
          />
          <div className="px-2 pb-3 pt-4 sm:px-4">
            <ChartFrame height={280}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierData.slice(0, 12)} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="supplier_id" {...xAxisProps} interval={0} angle={-30} textAnchor="end" height={56} />
                  <YAxis {...yAxisProps} tickFormatter={(v) => `$${v}`} />
                  <Tooltip cursor={barCursor} content={<ChartTooltip valueFormatter={fmt.money2} />} />
                  <Bar
                    dataKey="cost_per_unit"
                    name="Cost / unit"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                    isAnimationActive={animate}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </div>
        </Panel>
      ) : null}
    </div>
  );
};
