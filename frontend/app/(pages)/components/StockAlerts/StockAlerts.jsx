"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BellRing, PackageCheck, RefreshCw, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGlobalLoading } from "../../../context/loadingContext";
import { Metric, Panel, PanelHeader } from "@/components/dashboard/panel";
import { EmptyState, Skeleton, StatusBadge } from "@/components/dashboard/feedback";
import { SegmentedControl } from "@/components/dashboard/segmented-control";
import { cn } from "@/lib/utils";

const URGENCY = {
  critical: { status: "critical", label: "Critical" },
  warning: { status: "warning", label: "Warning" },
};

function AlertCard({ alert }) {
  const u = URGENCY[alert.urgency] ?? { status: "info", label: "Info" };
  const days = alert.days_until_stockout;
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        alert.urgency === "critical" && "border-critical/30"
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground">{alert.sku_name}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            <span className="font-mono">{alert.sku_id}</span> · {alert.store_id} · {alert.city}
          </p>
        </div>
        <StatusBadge status={u.status}>{u.label}</StatusBadge>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Metric label="On hand" value={alert.current_stock} valueClassName="text-base" />
        <Metric label="Safety stock" value={alert.safety_stock} valueClassName="text-base" />
        <Metric
          label="Runs out in"
          value={`${days.toFixed(1)} days`}
          valueClassName={cn("text-base", days < 1 ? "text-critical-ink" : "text-warning-ink")}
        />
        <Metric label="Lead time" value={`${alert.lead_time_days} days`} valueClassName="text-base" />
      </dl>

      <div className="flex items-center gap-3 rounded-xl bg-muted/70 px-3 py-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-card text-primary ring-1 ring-border">
          <ShoppingCart className="size-4" aria-hidden />
        </span>
        <p className="text-[13px] text-muted-foreground">
          Recommended:{" "}
          <span className="font-semibold text-foreground">
            order <span className="tabular-nums">{alert.recommended_order_qty}</span> units now
          </span>
        </p>
      </div>
    </article>
  );
}

export const StockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [selectedCountry] = useState("all");

  const { startLoading, stopLoading, isLoading } = useGlobalLoading();

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterUrgency, selectedCountry]);

  const fetchAlerts = async () => {
    startLoading();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/stock_alerts?country=${selectedCountry}&urgency=${filterUrgency}`
      );
      const data = await response.json();
      setAlerts(data.data || []);
    } catch (error) {
      toast.error("Failed to fetch stock alerts");
      console.error(error);
    } finally {
      setLoaded(true);
      stopLoading();
    }
  };

  const counts = useMemo(
    () => ({
      critical: alerts.filter((a) => a.urgency === "critical").length,
      warning: alerts.filter((a) => a.urgency === "warning").length,
    }),
    [alerts]
  );

  return (
    <Panel>
      <PanelHeader
        icon={BellRing}
        title="Inventory warnings"
        description="SKUs that will run out before a new order can arrive."
        actions={
          <>
            <SegmentedControl
              ariaLabel="Filter by urgency"
              value={filterUrgency}
              onValueChange={setFilterUrgency}
              size="sm"
              options={[
                { value: "all", label: "All" },
                { value: "critical", label: "Critical" },
                { value: "warning", label: "Warning" },
              ]}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAlerts}
              disabled={isLoading}
              aria-label="Refresh alerts"
            >
              <RefreshCw
                className={cn("size-3.5", isLoading && "animate-spin motion-reduce:animate-none")}
                aria-hidden
              />
              Refresh
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4 p-5">
        {alerts.length > 0 && filterUrgency === "all" ? (
          <p className="text-[13px] text-muted-foreground">
            <span className="font-semibold tabular-nums text-critical-ink">{counts.critical}</span>{" "}
            critical and{" "}
            <span className="font-semibold tabular-nums text-warning-ink">{counts.warning}</span>{" "}
            warning alerts.
          </p>
        ) : null}

        {alerts.length === 0 ? (
          loaded ? (
            <EmptyState
              icon={PackageCheck}
              title="No stock alerts right now"
              description="Every SKU-store is above its safety stock."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {alerts.map((alert) => (
              <AlertCard key={`${alert.sku_id}-${alert.store_id}`} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
};
