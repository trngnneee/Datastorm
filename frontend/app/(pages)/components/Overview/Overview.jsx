"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  BellRing,
  Filter,
  LayoutGrid,
  LineChart,
  PackageX,
  Receipt,
  Wallet,
} from "lucide-react";
import { Button as PressButton } from "@animate-ui/react/primitives/buttons/button";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevealGroup } from "@/components/dashboard/reveal";
import { NAV_ITEMS, hrefFor } from "../shell/nav";
import { useGlobalLoading } from "../../../context/loadingContext";

const STEPS = [
  {
    icon: LayoutGrid,
    title: "Pick a view",
    text: "Each section in the sidebar answers one question: where, how much, what is running out.",
  },
  {
    icon: Filter,
    title: "Scope it",
    text: "Country, year and month apply to every chart on the page at once.",
  },
  {
    icon: BellRing,
    title: "Act on it",
    text: "Stock alerts and days of coverage tell you what to order and when.",
  },
];

function ExploreCard({ item }) {
  const Icon = item.icon;
  return (
    <PressButton asChild tapScale={0.985}>
      <Link
        href={hrefFor(item)}
        scroll={false}
        className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[box-shadow,border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:hover:translate-y-0"
      >
        <div className="flex items-center justify-between">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/[0.07] text-primary">
            <Icon className="size-[18px]" aria-hidden />
          </span>
          <ArrowUpRight
            className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
            aria-hidden
          />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-foreground">{item.label}</p>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground text-pretty">
            {item.description}
          </p>
        </div>
      </Link>
    </PressButton>
  );
}

export const Overview = () => {
  const [kpi, setKpi] = useState(null);
  const { startLoading, stopLoading } = useGlobalLoading();

  useEffect(() => {
    const fetchKpi = async () => {
      startLoading();
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/kpi?country=all`
        );
        const json = await res.json();
        setKpi(json.data || null);
      } catch (error) {
        console.error(error);
      } finally {
        stopLoading();
      }
    };
    fetchKpi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const explore = NAV_ITEMS.filter((i) => i.key !== "overview");

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-card px-6 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-8 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_100%_0%,color-mix(in_srgb,var(--primary)_9%,transparent),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(50%_70%_at_90%_10%,black,transparent)] opacity-60"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-good" />
              FMCG data · 2021 – 2023
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.025em] text-foreground text-balance sm:text-[34px] sm:leading-[1.15]">
              Know what sells, what runs out, and what to order next.
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-6 text-muted-foreground text-pretty">
              DataStorm brings sales, inventory, pricing and weather into one
              place, with a 7-day demand forecast for every SKU and store.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/forecasting">
                <LineChart aria-hidden />
                Run a forecast
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={{ pathname: "/", query: { section: "alerts" } }} scroll={false}>
                View stock alerts
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Headline KPIs */}
      <section aria-labelledby="kpi-heading" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 id="kpi-heading" className="text-sm font-semibold text-foreground">
            All countries, all time
          </h2>
          <Link
            href={{ pathname: "/", query: { section: "financial" } }}
            scroll={false}
            className="text-[13px] font-medium text-primary hover:underline"
          >
            Financial details
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total sales"
            prefix="$"
            value={kpi ? kpi.total_sales || 0 : null}
            icon={Wallet}
            hint="Sum of net sales"
          />
          <KpiCard
            label="Promo contribution"
            value={kpi ? kpi.promo_contribution_pct || 0 : null}
            suffix="%"
            decimals={1}
            icon={BadgePercent}
            hint="Share of sales on promotion"
          />
          <KpiCard
            label="Stock-out rate"
            value={kpi ? kpi.stockout_rate_pct || 0 : null}
            suffix="%"
            decimals={2}
            icon={PackageX}
            hint="Share of daily records out of stock"
          />
          <KpiCard
            label="Transactions"
            value={kpi ? kpi.total_transactions || 0 : null}
            icon={Receipt}
            hint="Daily SKU-store sales records"
          />
        </div>
      </section>

      {/* Explore */}
      <section aria-labelledby="explore-heading" className="flex flex-col gap-3">
        <h2 id="explore-heading" className="text-sm font-semibold text-foreground">
          Explore
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <RevealGroup holdDelay={60}>
            {explore.map((item) => (
              <div key={item.key} className="h-full">
                <ExploreCard item={item} />
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* How it works */}
      <section
        aria-labelledby="how-heading"
        className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6"
      >
        <h2 id="how-heading" className="text-sm font-semibold text-foreground">
          How to use it
        </h2>
        <ol className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-sm font-semibold tabular-nums text-foreground/80">
                {i + 1}
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <step.icon className="size-4 text-muted-foreground" aria-hidden />
                  {step.title}
                </p>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
