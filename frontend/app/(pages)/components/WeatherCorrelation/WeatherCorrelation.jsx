"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
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
import {
  CloudRain,
  CloudSun,
  Lightbulb,
  Snowflake,
  Sun,
  Thermometer,
  TrendingUp,
} from "lucide-react";
import { useFilterStore } from "@/app/store/useFilterStore";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { EmptyState, InsightList, Skeleton } from "@/components/dashboard/feedback";
import { CellBar } from "@/components/dashboard/data-table";
import {
  ChartFrame,
  ChartTooltip,
  fmt,
  gridProps,
  lineCursor,
  barCursor,
  useChartAnimation,
  xAxisProps,
  yAxisProps,
} from "@/components/dashboard/chart-kit";

const calculateCorrelation = (data, var1, var2) => {
  if (data.length === 0) return 0;
  const n = data.length;
  const mean1 = data.reduce((sum, d) => sum + d[var1], 0) / n;
  const mean2 = data.reduce((sum, d) => sum + d[var2], 0) / n;
  const numerator = data.reduce((sum, d) => sum + (d[var1] - mean1) * (d[var2] - mean2), 0);
  const denominator =
    Math.sqrt(data.reduce((sum, d) => sum + Math.pow(d[var1] - mean1, 2), 0)) *
    Math.sqrt(data.reduce((sum, d) => sum + Math.pow(d[var2] - mean2, 2), 0));
  return denominator === 0 ? 0 : numerator / denominator;
};

const strength = (r) =>
  Math.abs(r) > 0.5 ? "Strong" : Math.abs(r) > 0.3 ? "Moderate" : "Weak";

/** r on a -1…1 track: diverging blue (negative) / red (positive) from a neutral center. */
function CorrelationTile({ icon: Icon, label, r, note }) {
  const pct = Math.min(1, Math.abs(r)) * 50;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-muted text-foreground/70">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-foreground">
          {r >= 0 ? "" : "−"}
          {Math.abs(r).toFixed(3)}
        </p>
        <span className="text-xs font-medium text-muted-foreground">
          {strength(r)} {r >= 0 ? "positive" : "negative"}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted" aria-hidden>
        <span className="absolute inset-y-[-3px] left-1/2 w-px bg-chart-axis" />
        <span
          className="absolute inset-y-0 rounded-full"
          style={{
            left: r >= 0 ? "50%" : `${50 - pct}%`,
            width: `${pct}%`,
            background: r >= 0 ? "var(--chart-8)" : "var(--chart-1)",
          }}
        />
      </div>
      <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
        <span>−1</span>
        <span>0</span>
        <span>+1</span>
      </div>
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

function SegmentList({ icon: Icon, title, items }) {
  const max = items.length ? Math.max(...items.map((i) => i.sales)) : 0;
  return (
    <div className="rounded-xl border p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        {title}
      </p>
      {items.length ? (
        <ul className="divide-y">
          {items.map((item) => (
            <li key={`${item.temperature_segment}-${item.category}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-foreground">{item.category}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="tabular-nums">{fmt.int(item.units)}</span> units ·{" "}
                  <span className="tabular-nums">{fmt.money2(item.avg_sales_per_transaction)}</span> per txn
                </p>
              </div>
              <CellBar value={item.sales} max={max} label={fmt.money(item.sales)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted-foreground">No days in this range.</p>
      )}
    </div>
  );
}

export const WeatherCorrelation = () => {
  const selectedCountry = useFilterStore((state) => state.selectedCountry);
  const selectedYear = useFilterStore((state) => state.selectedYear);
  const selectedMonth = useFilterStore((state) => state.selectedMonth);

  const [weatherData, setWeatherData] = useState([]);
  const [categoryWeatherData, setCategoryWeatherData] = useState([]);
  const [loading, setLoading] = useState(false);
  const animate = useChartAnimation();

  useEffect(() => {
    fetchWeatherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, selectedYear, selectedMonth]);

  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      const weatherRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/weather-correlation?country=${selectedCountry}&year=${selectedYear}&month=${selectedMonth}`
      );
      const weatherJson = await weatherRes.json();
      setWeatherData(weatherJson.data || []);

      const categoryRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/weather-by-category?country=${selectedCountry}&year=${selectedYear}`
      );
      const categoryJson = await categoryRes.json();
      setCategoryWeatherData(categoryJson.data || []);
    } catch (error) {
      toast.error("Failed to fetch weather data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const r = useMemo(
    () => ({
      tempSales: calculateCorrelation(weatherData, "temperature", "sales"),
      rainSales: calculateCorrelation(weatherData, "rain_mm", "sales"),
      tempUnits: calculateCorrelation(weatherData, "temperature", "units_sold"),
    }),
    [weatherData]
  );

  const cold = categoryWeatherData
    .filter((d) => d.temperature_segment === "Cold (<10°C)")
    .slice(0, 5);
  const warm = categoryWeatherData
    .filter((d) => d.temperature_segment.includes(">") || d.temperature_segment.includes("30"))
    .slice(0, 5);

  if (!weatherData.length && !categoryWeatherData.length) {
    return loading ? (
      <div className="grid gap-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    ) : (
      <EmptyState icon={CloudSun} title="No weather data for this scope" />
    );
  }

  // Three small multiples share the x-axis and a synced tooltip (no dual axis).
  const sharedX = { dataKey: "date", ...xAxisProps, minTickGap: 48, tickFormatter: fmt.date };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CorrelationTile icon={Thermometer} label="Temperature × sales" r={r.tempSales} />
        <CorrelationTile
          icon={CloudRain}
          label="Rainfall × sales"
          r={r.rainSales}
          note={r.rainSales < -0.3 ? "Rain is holding sales back" : "Rain has little effect"}
        />
        <CorrelationTile
          icon={TrendingUp}
          label="Temperature × units"
          r={r.tempUnits}
          note="How volume moves with temperature"
        />
      </div>

      {weatherData.length > 0 ? (
        <Panel>
          <PanelHeader
            icon={CloudSun}
            title="Sales, temperature and rainfall by day"
            description="Three views on one timeline; hover any of them to read all three."
          />
          <div className="flex flex-col gap-1 px-2 pb-4 pt-4 sm:px-4">
            <p className="px-2 text-xs font-medium text-muted-foreground">Net sales</p>
            <ChartFrame height={180}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weatherData} syncId="weather" margin={{ top: 6, right: 12, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...sharedX} hide />
                  <YAxis {...yAxisProps} tickFormatter={fmt.moneyCompact} />
                  <Tooltip cursor={lineCursor} content={<ChartTooltip valueFormatter={fmt.money} labelFormatter={fmt.date} />} />
                  <Area type="monotone" dataKey="sales" name="Net sales" stroke="var(--chart-1)" strokeWidth={2} fill="url(#wSales)" isAnimationActive={animate} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartFrame>

            <p className="mt-2 px-2 text-xs font-medium text-muted-foreground">Temperature (°C)</p>
            <ChartFrame height={140}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weatherData} syncId="weather" margin={{ top: 6, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...sharedX} hide />
                  <YAxis {...yAxisProps} tickFormatter={(v) => `${v}°`} />
                  <Tooltip cursor={lineCursor} content={<ChartTooltip valueFormatter={(v) => `${Number(v).toFixed(1)}°C`} labelFormatter={fmt.date} />} />
                  <Line type="monotone" dataKey="temperature" name="Temperature" stroke="var(--chart-2)" strokeWidth={2} dot={false} isAnimationActive={animate} />
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>

            <p className="mt-2 px-2 text-xs font-medium text-muted-foreground">Rainfall (mm)</p>
            <ChartFrame height={150}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weatherData} syncId="weather" margin={{ top: 6, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...sharedX} />
                  <YAxis {...yAxisProps} />
                  <Tooltip cursor={barCursor} content={<ChartTooltip valueFormatter={(v) => `${v} mm`} labelFormatter={fmt.date} />} />
                  <Bar dataKey="rain_mm" name="Rainfall" fill="var(--chart-3)" radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </div>
        </Panel>
      ) : null}

      {categoryWeatherData.length > 0 ? (
        <Panel>
          <PanelHeader
            icon={Thermometer}
            title="Category sales by temperature"
            description="Top categories on cold days and on warm or hot days."
          />
          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
            <SegmentList icon={Snowflake} title="Cold (below 10°C)" items={cold} />
            <SegmentList icon={Sun} title="Warm and hot (above 20°C)" items={warm} />
          </div>
        </Panel>
      ) : null}

      <InsightList
        icon={Lightbulb}
        title="Weather impact"
        items={[
          <>
            Temperature has a{" "}
            <span className="font-semibold text-foreground">{strength(r.tempSales).toLowerCase()}</span>{" "}
            correlation with sales (r = {r.tempSales.toFixed(3)}).
          </>,
          <>
            Rainfall has a{" "}
            <span className="font-semibold text-foreground">
              {r.rainSales < -0.3 ? "negative" : r.rainSales > 0.3 ? "positive" : "minimal"}
            </span>{" "}
            effect on sales.
          </>,
          "Plan seasonal adjustments in forecasting and inventory around these weather patterns.",
          "Categories react differently to temperature; time promotions to match.",
        ]}
      />
    </div>
  );
};
