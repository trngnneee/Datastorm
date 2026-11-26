"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BadgePercent, PackageX, PieChart, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useFilterStore } from "@/app/store/useFilterStore";
import { toast } from "sonner";
import { useGlobalLoading } from "../../../context/loadingContext";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { EmptyState, Skeleton } from "@/components/dashboard/feedback";
import { CellBar, DataTable, TBody, TD, TH, THead, TR } from "@/components/dashboard/data-table";
import {
  ChartFrame,
  ChartTooltip,
  barCursor,
  fmt,
  gridProps,
  lineCursor,
  useChartAnimation,
  xAxisProps,
  yAxisProps,
} from "@/components/dashboard/chart-kit";

export const FinancialAnalytics = () => {
  const selectedCountry = useFilterStore((state) => state.selectedCountry);
  const selectedYear = useFilterStore((state) => state.selectedYear);
  const startDate = useFilterStore((state) => state.startDate);
  const endDate = useFilterStore((state) => state.endDate);
  const selectedMonth = useFilterStore((state) => state.selectedMonth);

  const { startLoading, stopLoading } = useGlobalLoading();
  const [loading, setLoading] = useState(false);

  const [revenueData, setRevenueData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [kpiData, setKpiData] = useState(null);

  const animate = useChartAnimation();

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, selectedYear, startDate, endDate, selectedMonth]);

  const fetchAnalytics = async () => {
    try {
      setProfitData([]);
      setRevenueData([]);
      setKpiData(null);
      startLoading();
      setLoading(true);
      const revenueRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/revenue?country=${selectedCountry}&year=${selectedYear}&month=${selectedMonth}`
      );
      const revenueJson = await revenueRes.json();
      setRevenueData(revenueJson.data || []);

      const profitRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/profit?country=${selectedCountry}&year=${selectedYear}`
      );
      const profitJson = await profitRes.json();
      setProfitData(profitJson.data || []);

      const kpiRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/kpi?country=${selectedCountry}`
      );
      const kpiJson = await kpiRes.json();
      setKpiData(kpiJson.data || null);
    } catch (error) {
      toast.error("Failed to fetch financial analytics");
      console.error(error);
    } finally {
      stopLoading();
      setLoading(false);
    }
  };

  const ranked = useMemo(
    () => [...profitData].sort((a, b) => b.profit - a.profit),
    [profitData]
  );
  const maxProfit = ranked.length ? Math.max(...ranked.map((r) => r.profit)) : 0;
  const totals = useMemo(
    () =>
      profitData.reduce(
        (acc, r) => ({
          revenue: acc.revenue + (r.revenue || 0),
          cost: acc.cost + (r.cost || 0),
          profit: acc.profit + (r.profit || 0),
        }),
        { revenue: 0, cost: 0, profit: 0 }
      ),
    [profitData]
  );

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Key figures" className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Totals for the selected country across all years.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total sales"
            prefix="$"
            value={kpiData ? kpiData.total_sales || 0 : null}
            icon={Wallet}
          />
          <KpiCard
            label="Promo contribution"
            value={kpiData ? kpiData.promo_contribution_pct || 0 : null}
            suffix="%"
            decimals={1}
            icon={BadgePercent}
          />
          <KpiCard
            label="Stock-out rate"
            value={kpiData ? kpiData.stockout_rate_pct || 0 : null}
            suffix="%"
            decimals={2}
            icon={PackageX}
          />
          <KpiCard
            label="Transactions"
            value={kpiData ? kpiData.total_transactions || 0 : null}
            icon={Receipt}
          />
        </div>
      </section>

      <Panel>
        <PanelHeader
          icon={TrendingUp}
          title="Daily net sales"
          description="Net sales per day for the selected country, year and month."
        />
        <div className="px-2 pb-4 pt-4 sm:px-4">
          {revenueData.length > 0 ? (
            <ChartFrame height={280}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="date" {...xAxisProps} minTickGap={48} tickFormatter={fmt.date} />
                  <YAxis {...yAxisProps} tickFormatter={fmt.moneyCompact} />
                  <Tooltip
                    cursor={lineCursor}
                    content={<ChartTooltip valueFormatter={fmt.money} labelFormatter={fmt.date} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Net sales"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#revFill)"
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                    isAnimationActive={animate}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartFrame>
          ) : loading ? (
            <Skeleton className="mx-2 h-[280px]" />
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No sales in this period"
              description="Try a different country, year or month."
              className="mx-2"
            />
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          icon={PieChart}
          title="Profit by category"
          description="Revenue minus purchase cost, ranked by profit."
        />
        {ranked.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 pt-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="px-2 pb-4 sm:px-4">
              <ChartFrame height={Math.max(220, ranked.length * 44 + 40)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ranked}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                    barCategoryGap={10}
                  >
                    <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                    <XAxis type="number" {...xAxisProps} tickFormatter={fmt.moneyCompact} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      {...yAxisProps}
                      width={110}
                      tick={{ fontSize: 12, fill: "var(--foreground)" }}
                    />
                    <Tooltip
                      cursor={barCursor}
                      content={<ChartTooltip valueFormatter={fmt.money} />}
                    />
                    <Bar
                      dataKey="profit"
                      name="Profit"
                      fill="var(--chart-1)"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={22}
                      isAnimationActive={animate}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </div>
            <DataTable className="border-t xl:border-l xl:border-t-0">
              <THead>
                <tr>
                  <TH>Category</TH>
                  <TH align="right">Revenue</TH>
                  <TH align="right">Cost</TH>
                  <TH align="right">Profit</TH>
                  <TH align="right">Margin</TH>
                </tr>
              </THead>
              <TBody>
                {ranked.map((row) => (
                  <TR key={row.category}>
                    <TD className="font-medium">{row.category}</TD>
                    <TD align="right">{fmt.money(row.revenue)}</TD>
                    <TD align="right" className="text-muted-foreground">
                      {fmt.money(row.cost)}
                    </TD>
                    <TD align="right">
                      <CellBar value={row.profit} max={maxProfit} label={fmt.money(row.profit)} />
                    </TD>
                    <TD align="right" className="font-medium">
                      {fmt.pct(row.margin_pct, 2)}
                    </TD>
                  </TR>
                ))}
                <tr className="bg-muted/50 font-semibold">
                  <TD>Total</TD>
                  <TD align="right">{fmt.money(totals.revenue)}</TD>
                  <TD align="right">{fmt.money(totals.cost)}</TD>
                  <TD align="right">{fmt.money(totals.profit)}</TD>
                  <TD align="right">
                    {totals.revenue ? fmt.pct((totals.profit / totals.revenue) * 100, 2) : "—"}
                  </TD>
                </tr>
              </TBody>
            </DataTable>
          </div>
        ) : (
          <div className="p-5">
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <EmptyState icon={PieChart} title="No profit data for this scope" />
            )}
          </div>
        )}
      </Panel>
    </div>
  );
};
