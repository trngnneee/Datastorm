"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  BarChart3,
  Boxes,
  Clock,
  Grid2X2,
  Loader2,
  Package,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SuggestionBox } from "./SuggestionBox";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Panel, PanelHeader, SectionHeading } from "@/components/dashboard/panel";
import { EmptyState } from "@/components/dashboard/feedback";
import { Reveal } from "@/components/dashboard/reveal";
import {
  ChartFrame,
  ChartLegend,
  ChartTooltip,
  barCursor,
  fmt,
  gridProps,
  lineCursor,
  useChartAnimation,
  xAxisProps,
  yAxisProps,
} from "@/components/dashboard/chart-kit";
import { useGlobalLoading } from "../../../context/loadingContext";
import { cn } from "@/lib/utils";

function Step({ n, label, icon: Icon, htmlFor, done, children }) {
  return (
    <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
      >
        <span
          className={cn(
            "grid size-4 place-items-center rounded-full text-[10px] font-semibold tabular-nums transition-colors duration-200",
            done ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"
          )}
        >
          {n}
        </span>
        <Icon className="size-3.5" aria-hidden />
        {label}
      </label>
      {children}
    </div>
  );
}

export const DemandForecast = () => {
  const [storeList, setStoreList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [brandList, setBrandList] = useState([]);
  const [oldUnitSoldData, setOldUnitSoldData] = useState([]);
  const { startLoading, stopLoading } = useGlobalLoading();
  const animate = useChartAnimation();

  useEffect(() => {
    const fetchData = async () => {
      startLoading();
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/store/list`)
          .then((res) => res.json())
          .then((data) => setStoreList(data.data));
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category/list`)
          .then((res) => res.json())
          .then((data) => setCategoryList(data.data));
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/brand/list`)
          .then((res) => res.json())
          .then((data) => setBrandList(data.data));
      } catch (error) {
        toast.error("Failed to load filters");
        console.error(error);
      } finally {
        stopLoading();
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedStore, setSelectedStore] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  const [productList, setProductList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  useEffect(() => {
    setProductList([]);
    setSelectedProduct("");
    if (selectedStore && selectedCategory && selectedBrand) {
      const fetchProductList = async () => {
        setLoadingProducts(true);
        startLoading();
        try {
          const query = [
            `store=${encodeURIComponent(selectedStore)}`,
            `category=${encodeURIComponent(selectedCategory)}`,
            `brand=${encodeURIComponent(selectedBrand)}`,
          ].join("&");
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product/list?${query}`);
          const data = await res.json();
          setProductList(data.data || []);
        } catch (error) {
          toast.error("Failed to load products");
          console.error(error);
        } finally {
          setLoadingProducts(false);
          stopLoading();
        }
      };
      fetchProductList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore, selectedCategory, selectedBrand]);

  const [predictedData, setPredictedData] = useState([]);
  const [predictedLeadTime, setPredictedLeadTime] = useState([]);
  const [fetchingPrediction, setFetchingPrediction] = useState(false);
  const ready = selectedStore && selectedProduct && selectedCategory && selectedBrand;

  const handleFilter = () => {
    setSaleDemandSuggestion(null);
    setLeadTimeSuggestion(null);
    setPredictedData([]);
    setPredictedLeadTime([]);
    setOldUnitSoldData([]);
    const fetchPredictedData = async () => {
      if (!ready) return;
      const toastId = toast.loading("Running the 7-day forecast…");
      setFetchingPrediction(true);
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/unit_sold/daily?country=all&year=2023&month=12&store=${encodeURIComponent(selectedStore)}&category=${encodeURIComponent(selectedCategory)}&brand=${encodeURIComponent(selectedBrand)}&sku_id=${encodeURIComponent(selectedProduct)}`
        )
          .then((res) => res.json())
          .then((data) => setOldUnitSoldData(data.data || []));

        const payload = {
          start_date: "2024-01-01",
          store_id: selectedStore,
          sku_id: selectedProduct,
          category: selectedCategory,
          brand: selectedBrand,
        };

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict_7days`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        const forecasts = data.data.daily_forecasts;

        setPredictedData(
          forecasts.map((item) => ({
            date: item.date,
            predicted_unit_sold: Number(item.demand.units_sold.toFixed(2)),
          }))
        );
        setPredictedLeadTime(
          forecasts.map((item) => ({
            date: item.date,
            predicted_unit_sold: Number(item.supply.lead_time_days.toFixed(2)),
          }))
        );
        toast.success("Forecast ready", { id: toastId });
      } catch (err) {
        toast.error("Failed to fetch demand forecast.", { id: toastId });
        console.error("Prediction error:", err);
      } finally {
        setFetchingPrediction(false);
      }
    };
    fetchPredictedData();
  };

  const [saleDemandSuggestion, setSaleDemandSuggestion] = useState(null);
  const [leadTimeSuggestion, setLeadTimeSuggestion] = useState(null);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  useEffect(() => {
    if (predictedData.length === 0) return;

    const fetchSuggestions = async () => {
      setIsSuggestionLoading(true);
      try {
        const [saleRes, leadRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/suggestion/sales_demand`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              forecast_data: predictedData,
              sku_id: selectedProduct,
              store_id: selectedStore,
              category: selectedCategory,
              brand: selectedBrand,
            }),
          }).then((res) => res.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/suggestion/lead_time`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              forecast_data: predictedLeadTime,
              sku_id: selectedProduct,
              store_id: selectedStore,
              category: selectedCategory,
              brand: selectedBrand,
            }),
          }).then((res) => res.json()),
        ]);
        setSaleDemandSuggestion(saleRes.message);
        setLeadTimeSuggestion(leadRes.message);
      } catch (err) {
        console.error(err);
        toast.error("Failed to generate suggestions");
      } finally {
        setIsSuggestionLoading(false);
      }
    };

    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictedData]);

  const demandChartData = useMemo(
    () =>
      [
        ...oldUnitSoldData.map((item) => ({
          date: item.date,
          unit_sold: item.units_sold ?? 0,
          predicted_unit_sold: null,
        })),
        ...predictedData.map((item) => ({
          date: item.date,
          unit_sold: null,
          predicted_unit_sold: item.predicted_unit_sold,
        })),
      ].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [oldUnitSoldData, predictedData]
  );

  const leadTimeChartData = useMemo(
    () => [...predictedLeadTime].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [predictedLeadTime]
  );

  const totals = useMemo(() => {
    if (!predictedData.length) return null;
    const units = predictedData.reduce((s, d) => s + d.predicted_unit_sold, 0);
    const lead = predictedLeadTime.length
      ? predictedLeadTime.reduce((s, d) => s + d.predicted_unit_sold, 0) / predictedLeadTime.length
      : null;
    const last7 = oldUnitSoldData.slice(-7);
    const last7Units = last7.reduce((s, d) => s + (d.units_sold ?? 0), 0);
    return { units, avg: units / predictedData.length, lead, last7Units, hasLast7: last7.length > 0 };
  }, [predictedData, predictedLeadTime, oldUnitSoldData]);

  const productName =
    productList.find((p) => p.sku_id === selectedProduct)?.sku_name ?? selectedProduct;

  const selectClass = "h-9 w-full rounded-lg bg-card";

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="Planning"
        title="7-day demand forecast"
        description="Pick a product in a store to forecast its units sold and supplier lead time for the first week of January 2024."
      />

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4">
        <Step n={1} label="Store" icon={Store} htmlFor="fc-store" done={!!selectedStore}>
          <Select
            value={selectedStore}
            onValueChange={setSelectedStore}
            disabled={storeList.length === 0 || fetchingPrediction}
          >
            <SelectTrigger id="fc-store" className={selectClass}>
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              {storeList?.map((store) => (
                <SelectItem key={store} value={store}>
                  {store}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Step>
        <Step n={2} label="Category" icon={Grid2X2} htmlFor="fc-category" done={!!selectedCategory}>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            disabled={categoryList.length === 0 || fetchingPrediction}
          >
            <SelectTrigger id="fc-category" className={selectClass}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryList?.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Step>
        <Step n={3} label="Brand" icon={ShoppingCart} htmlFor="fc-brand" done={!!selectedBrand}>
          <Select
            value={selectedBrand}
            onValueChange={setSelectedBrand}
            disabled={brandList.length === 0 || fetchingPrediction}
          >
            <SelectTrigger id="fc-brand" className={selectClass}>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {brandList?.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Step>
        <Step n={4} label="Product" icon={Package} htmlFor="fc-product" done={!!selectedProduct}>
          <Select
            value={selectedProduct}
            onValueChange={setSelectedProduct}
            disabled={productList.length === 0 || fetchingPrediction}
          >
            <SelectTrigger id="fc-product" className={selectClass}>
              <SelectValue
                placeholder={
                  loadingProducts
                    ? "Loading products…"
                    : selectedStore && selectedCategory && selectedBrand
                      ? productList.length
                        ? "Select product"
                        : "No products match"
                      : "Pick steps 1–3 first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {productList?.map((product, index) => (
                <SelectItem key={index} value={product.sku_id}>
                  {product.sku_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Step>
        <div className="flex w-full sm:w-auto">
          <Button
            onClick={handleFilter}
            disabled={!ready || fetchingPrediction}
            className="w-full min-w-40"
          >
            {fetchingPrediction ? (
              <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <Sparkles aria-hidden />
            )}
            {fetchingPrediction ? "Forecasting…" : "Run forecast"}
          </Button>
        </div>
      </div>

      {predictedData.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={fetchingPrediction ? "Running the model…" : "No forecast yet"}
          description="Choose a store, category, brand and product, then run the forecast. Results show December 2023 actuals next to the next 7 days."
          className="py-16"
        />
      ) : (
        <Reveal key={`${selectedStore}-${selectedProduct}-${predictedData[0]?.date}`} surface>
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
              <span className="font-medium text-foreground">{productName}</span>
              <span aria-hidden>·</span>
              <span>{selectedStore}</span>
              <span aria-hidden>·</span>
              <span>{selectedCategory}</span>
              <span aria-hidden>·</span>
              <span>{selectedBrand}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard
                label="Forecast units, next 7 days"
                value={totals?.units ?? null}
                icon={Boxes}
                hint={
                  totals?.hasLast7
                    ? `Last 7 days of Dec 2023: ${fmt.int(totals.last7Units)} units`
                    : undefined
                }
              />
              <KpiCard
                label="Average per day"
                value={totals?.avg ?? null}
                decimals={1}
                suffix="units"
                icon={BarChart3}
              />
              <KpiCard
                label="Average supplier lead time"
                value={totals?.lead ?? null}
                decimals={1}
                suffix="days"
                icon={Truck}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Panel>
                <PanelHeader
                  icon={BarChart3}
                  title="Units sold: December 2023 and the next 7 days"
                  actions={
                    <ChartLegend
                      items={[
                        { label: "Actual", color: "var(--chart-1)" },
                        { label: "Forecast", color: "var(--chart-2)" },
                      ]}
                    />
                  }
                />
                <div className="px-2 pb-4 pt-4 sm:px-4">
                  <ChartFrame height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demandChartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }} barCategoryGap="18%">
                        <CartesianGrid {...gridProps} />
                        <XAxis dataKey="date" {...xAxisProps} minTickGap={36} tickFormatter={fmt.date} />
                        <YAxis {...yAxisProps} />
                        <Tooltip
                          cursor={barCursor}
                          content={<ChartTooltip valueFormatter={(v) => fmt.int(v)} labelFormatter={fmt.date} />}
                        />
                        <Bar dataKey="unit_sold" name="Actual" stackId="units" fill="var(--chart-1)" radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                        <Bar dataKey="predicted_unit_sold" name="Forecast" stackId="units" fill="var(--chart-2)" radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartFrame>
                </div>
              </Panel>
              <SuggestionBox
                title="Demand recommendation"
                description="What to do with this week's forecast."
                suggestion={saleDemandSuggestion}
                loading={isSuggestionLoading}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Panel>
                <PanelHeader
                  icon={Clock}
                  title="Supplier lead time forecast"
                  description="Expected days from order to delivery, per order date."
                />
                <div className="px-2 pb-4 pt-4 sm:px-4">
                  <ChartFrame height={260}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={leadTimeChartData} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                        <CartesianGrid {...gridProps} />
                        <XAxis dataKey="date" {...xAxisProps} tickFormatter={fmt.date} />
                        <YAxis {...yAxisProps} tickFormatter={(v) => `${v}d`} domain={["auto", "auto"]} />
                        <Tooltip
                          cursor={lineCursor}
                          content={<ChartTooltip valueFormatter={(v) => `${Number(v).toFixed(2)} days`} labelFormatter={fmt.date} />}
                        />
                        <Line
                          type="monotone"
                          dataKey="predicted_unit_sold"
                          name="Lead time"
                          stroke="var(--chart-1)"
                          strokeWidth={2}
                          dot={{ r: 4, strokeWidth: 2, stroke: "var(--card)", fill: "var(--chart-1)" }}
                          activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
                          isAnimationActive={animate}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartFrame>
                </div>
              </Panel>
              <SuggestionBox
                title="Lead time recommendation"
                description="When to place the next order."
                suggestion={leadTimeSuggestion}
                loading={isSuggestionLoading}
              />
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
};
