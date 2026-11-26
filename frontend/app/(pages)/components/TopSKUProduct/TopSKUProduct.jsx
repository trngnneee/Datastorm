"use client";

import { useEffect, useState } from "react";
import { Eye, Trophy } from "lucide-react";
import { useGlobalLoading } from "../../../context/loadingContext";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { EmptyState, Skeleton, StatusBadge } from "@/components/dashboard/feedback";
import { CellBar, DataTable, TBody, TD, TH, THead, TR } from "@/components/dashboard/data-table";
import { fmt } from "@/components/dashboard/chart-kit";
import { cn } from "@/lib/utils";

export const TopSKUProduct = () => {
  const [topProducts, setTopProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { startLoading, stopLoading } = useGlobalLoading();

  useEffect(() => {
    const fetchData = async () => {
      startLoading();
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sku/top?limit=10`);
        const data = await res.json();
        setTopProducts(data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoaded(true);
        stopLoading();
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxUnits = topProducts.length
    ? Math.max(...topProducts.map((p) => p.units_sold || 0))
    : 0;

  return (
    <Panel>
      <PanelHeader
        icon={Trophy}
        title="Top 10 SKU-store pairs by units sold"
        description="Best sellers burn through stock fastest, so they are on watch by default."
      />
      {topProducts.length > 0 ? (
        <DataTable className="mt-4">
          <THead>
            <tr>
              <TH className="w-12">#</TH>
              <TH>Product</TH>
              <TH>Supplier</TH>
              <TH>Store</TH>
              <TH align="right">Units sold</TH>
              <TH align="right">Net sales</TH>
              <TH align="right">Opening stock</TH>
              <TH>Alert</TH>
            </tr>
          </THead>
          <TBody>
            {topProducts.map((product, index) => (
              <TR key={`${product.sku_id}-${product.store_id}-${index}`}>
                <TD>
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-md text-xs font-semibold tabular-nums",
                      index < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"
                    )}
                  >
                    {index + 1}
                  </span>
                </TD>
                <TD>
                  <p className="max-w-64 truncate font-medium text-foreground">
                    {product.sku_name ?? "—"}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {product.sku_id ?? "—"}
                  </p>
                </TD>
                <TD mono>{product.supplier_id ?? "—"}</TD>
                <TD>
                  <p className="text-foreground">{product.city ?? "—"}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {product.store_id ?? "—"}
                  </p>
                </TD>
                <TD align="right">
                  <CellBar
                    value={product.units_sold || 0}
                    max={maxUnits}
                    label={fmt.int(product.units_sold)}
                  />
                </TD>
                <TD align="right" className="font-medium">
                  {product.net_sales ? fmt.money2(product.net_sales) : "—"}
                </TD>
                <TD align="right">{product.stock_opening ?? "—"}</TD>
                <TD>
                  <StatusBadge status="warning" icon={Eye}>
                    Watch
                  </StatusBadge>
                </TD>
              </TR>
            ))}
          </TBody>
        </DataTable>
      ) : (
        <div className="p-5">
          {loaded ? (
            <EmptyState icon={Trophy} title="No top-selling SKUs available yet" />
          ) : (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11" />
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
};
