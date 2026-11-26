"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BadgePercent, Boxes, LineChart as LineIcon, Store } from "lucide-react";
import { useFilterStore } from "@/app/store/useFilterStore";
import { toast } from "sonner";
import { Metric, Panel, PanelHeader } from "@/components/dashboard/panel";
import { EmptyState, Skeleton } from "@/components/dashboard/feedback";
import {
  ChartFrame,
  ChartLegend,
  ChartTooltip,
  barCursor,
  colorMap,
  fmt,
  gridProps,
  lineCursor,
  useChartAnimation,
  xAxisProps,
  yAxisProps,
} from "@/components/dashboard/chart-kit";

export const ChannelAnalytics = () => {
  const selectedCountry = useFilterStore((state) => state.selectedCountry);
  const selectedYear = useFilterStore((state) => state.selectedYear);
  const selectedMonth = useFilterStore((state) => state.selectedMonth);

  const [channelData, setChannelData] = useState([]);
  const [dailyChannelData, setDailyChannelData] = useState([]);
  const [loading, setLoading] = useState(false);
  const animate = useChartAnimation();

  useEffect(() => {
    fetchChannelData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, selectedYear, selectedMonth]);

  const fetchChannelData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/channel?country=${selectedCountry}&year=${selectedYear}&month=${selectedMonth}`
      );
      const json = await res.json();
      setChannelData(json.data || []);

      const dailyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/channel/daily?country=${selectedCountry}&year=${selectedYear}&month=${selectedMonth}`
      );
      const dailyJson = await dailyRes.json();
      setDailyChannelData(dailyJson.data || []);
    } catch (error) {
      toast.error("Failed to fetch channel analytics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Color follows the channel name, not its rank.
  const colors = useMemo(
    () => colorMap([...channelData.map((c) => c.channel), ...dailyChannelData.map((d) => d.channel)]),
    [channelData, dailyChannelData]
  );

  const transformedDailyData = useMemo(() => {
    const byDate = {};
    dailyChannelData.forEach((item) => {
      if (!byDate[item.date]) byDate[item.date] = { date: item.date };
      byDate[item.date][item.channel] = item.sales;
    });
    return Object.values(byDate);
  }, [dailyChannelData]);

  const legend = channelData.map((c) => ({ label: c.channel, color: colors[c.channel] }));

  if (!channelData.length) {
    return loading ? (
      <div className="grid gap-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    ) : (
      <EmptyState icon={Store} title="No channel data for this scope" />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader
          icon={Store}
          title="Sales mix by channel"
          description="Share of net sales, with each channel's footprint."
        />
        <div className="flex flex-col gap-5 p-5">
          <div>
            <div
              className="flex h-10 w-full gap-0.5 overflow-hidden rounded-lg"
              role="img"
              aria-label={channelData
                .map((c) => `${c.channel} ${c.sales_pct}%`)
                .join(", ")}
            >
              {channelData.map((c) => (
                <div
                  key={c.channel}
                  className="@container flex min-w-0 items-center px-2 text-xs font-semibold first:rounded-l-lg last:rounded-r-lg"
                  style={{
                    width: `${c.sales_pct}%`,
                    background: colors[c.channel],
                    color: colors[c.channel] === "var(--chart-4)" ? "#0b0b0b" : "#ffffff",
                  }}
                  title={`${c.channel}: ${c.sales_pct}%`}
                >
                  <span className="hidden whitespace-nowrap @min-[2.25rem]:inline">
                    {c.sales_pct}%
                  </span>
                </div>
              ))}
            </div>
            <ChartLegend items={legend} className="mt-3" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {channelData.map((c) => (
              <div key={c.channel} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-2 font-medium text-foreground">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-[3px]"
                      style={{ background: colors[c.channel] }}
                    />
                    <span className="truncate">{c.channel}</span>
                  </p>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {c.sales_pct}%
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                  <Metric label="Sales" value={fmt.money(c.sales)} />
                  <Metric label="Units" value={fmt.int(c.units)} />
                  <Metric label="Stores" value={c.stores} />
                  <Metric label="Products" value={c.products} />
                  <Metric label="Avg discount" value={`${c.avg_discount_pct}%`} />
                  <Metric label="Stock-outs" value={fmt.int(c.stockout_count)} />
                </dl>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {transformedDailyData.length > 0 ? (
        <Panel>
          <PanelHeader
            icon={LineIcon}
            title="Daily sales by channel"
            description="Net sales per day, one line per channel."
            actions={<ChartLegend items={legend.map((l) => ({ ...l, type: "line" }))} />}
          />
          <div className="px-2 pb-4 pt-4 sm:px-4">
            <ChartFrame height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transformedDailyData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="date" {...xAxisProps} minTickGap={48} tickFormatter={fmt.date} />
                  <YAxis {...yAxisProps} tickFormatter={fmt.moneyCompact} />
                  <Tooltip
                    cursor={lineCursor}
                    content={<ChartTooltip valueFormatter={fmt.money} labelFormatter={fmt.date} />}
                  />
                  {channelData.map((c) => (
                    <Line
                      key={c.channel}
                      type="monotone"
                      dataKey={c.channel}
                      name={c.channel}
                      stroke={colors[c.channel]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                      isAnimationActive={animate}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
          </div>
        </Panel>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader icon={Boxes} title="Units sold by channel" />
          <div className="px-2 pb-4 pt-4 sm:px-4">
            <ChartFrame height={240}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="channel" {...xAxisProps} />
                  <YAxis {...yAxisProps} tickFormatter={fmt.compact} />
                  <Tooltip cursor={barCursor} content={<ChartTooltip valueFormatter={fmt.int} />} />
                  <Bar
                    dataKey="units"
                    name="Units"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                    isAnimationActive={animate}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </div>
        </Panel>

        <Panel>
          <PanelHeader icon={BadgePercent} title="Average discount by channel" />
          <div className="px-2 pb-4 pt-4 sm:px-4">
            <ChartFrame height={240}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="channel" {...xAxisProps} />
                  <YAxis {...yAxisProps} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    cursor={barCursor}
                    content={<ChartTooltip valueFormatter={(v) => `${v}%`} />}
                  />
                  <Bar
                    dataKey="avg_discount_pct"
                    name="Avg discount"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                    isAnimationActive={animate}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </div>
        </Panel>
      </div>
    </div>
  );
};
