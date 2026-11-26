"use client";

import { useEffect, useState } from "react";
import { parseDate } from "@internationalized/date";
import { CalendarClock, CalendarDays, ChevronDown, MapPin, Store } from "lucide-react";
import { formatDate, formatDateForAPI } from "../../../utils/date";
import { Calendar as CalendarComponent } from "@/components/ui/calendar-rac";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PaginationComponent from "../PaginationComponent.jsx";
import { useGlobalLoading } from "../../../context/loadingContext.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { EmptyState, Skeleton, StatusBadge } from "@/components/dashboard/feedback";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/dashboard/data-table";
import { fmt } from "@/components/dashboard/chart-kit";
import { cn } from "@/lib/utils";

const DATA_START = "2021-01-01";
const DATA_END = "2023-12-31";
const PAGE_SIZE = 10;

const daysHours = (value) => {
  const abs = Math.abs(value);
  const days = Math.floor(abs);
  const hours = Math.round((abs - days) * 24);
  return `${days}d ${hours}h`;
};

function Field({ label, icon: Icon, htmlFor, children }) {
  return (
    <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </label>
      {children}
    </div>
  );
}

function CoverageBadge({ doc }) {
  if (doc >= 7) return <StatusBadge status="good">Healthy · {daysHours(doc)}</StatusBadge>;
  if (doc >= 4) return <StatusBadge status="warning">Moderate · {daysHours(doc)}</StatusBadge>;
  return <StatusBadge status="critical">Low · {daysHours(doc)}</StatusBadge>;
}

function OrderBadge({ dayUntilOrder }) {
  if (dayUntilOrder < 0)
    return <StatusBadge status="critical">Overdue {daysHours(dayUntilOrder)}</StatusBadge>;
  if (dayUntilOrder >= 7) return <StatusBadge status="good">In {daysHours(dayUntilOrder)}</StatusBadge>;
  if (dayUntilOrder >= 4) return <StatusBadge status="warning">In {daysHours(dayUntilOrder)}</StatusBadge>;
  return <StatusBadge status="serious">In {daysHours(dayUntilOrder)}</StatusBadge>;
}

export const DayOfCover = () => {
  const [productList, setProductList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date("2021-01-01"));
  const [dateOpen, setDateOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");

  const { startLoading, stopLoading, isLoading } = useGlobalLoading();

  const [stores, setStores] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      startLoading();
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/store/list`)
          .then((res) => res.json())
          .then((data) => setStores(data.data));
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/city/list`)
          .then((res) => res.json())
          .then((data) => setCities(data.data));
      } catch (error) {
        console.error(error);
      } finally {
        stopLoading();
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setProductList([]);
    const fetchData = async () => {
      startLoading();
      try {
        const date = formatDateForAPI(selectedDate);
        let url = `${process.env.NEXT_PUBLIC_API_URL}/sku/list?date=${date}&page=${currentPage}&limit=${PAGE_SIZE}`;
        if (selectedStore) url += `&store_id=${selectedStore}`;
        if (selectedCity) url += `&city=${selectedCity}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.code == "success") {
          setProductList(data.data);
          setTotalPages(data.pagination.total_pages);
        } else {
          setProductList([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error(error);
      } finally {
        stopLoading();
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, currentPage, selectedStore, selectedCity]);

  const onPickDate = (date) => {
    if (date) {
      const jsDate =
        date instanceof Date ? date : new Date(date.year, date.month - 1, date.day);
      setSelectedDate(jsDate);
    } else {
      setSelectedDate(new Date("2021-01-01"));
    }
    setCurrentPage(1);
    setDateOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4">
        <Field label="Snapshot date" icon={CalendarDays} htmlFor="doc-date">
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <button
                id="doc-date"
                type="button"
                className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 text-sm text-foreground shadow-xs outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <span className="tabular-nums">{formatDate(selectedDate)}</span>
                <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto rounded-xl p-2">
              <CalendarComponent
                value={parseDate(formatDateForAPI(selectedDate))}
                minValue={parseDate(DATA_START)}
                maxValue={parseDate(DATA_END)}
                onChange={onPickDate}
              />
            </PopoverContent>
          </Popover>
        </Field>

        <Field label="Store" icon={Store} htmlFor="doc-store">
          <Select
            value={selectedStore}
            onValueChange={(value) => {
              setSelectedStore(value);
              setCurrentPage(1);
            }}
            disabled={isLoading && !stores.length}
          >
            <SelectTrigger id="doc-store" className="h-9 w-full rounded-lg bg-card">
              <SelectValue placeholder="All stores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stores</SelectItem>
              {stores?.map((store) => (
                <SelectItem key={store} value={store}>
                  {store}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="City" icon={MapPin} htmlFor="doc-city">
          <Select
            value={selectedCity}
            onValueChange={(value) => {
              setSelectedCity(value);
              setCurrentPage(1);
            }}
            disabled={isLoading && !cities.length}
          >
            <SelectTrigger id="doc-city" className="h-9 w-full rounded-lg bg-card">
              <SelectValue placeholder="All cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {cities?.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Panel>
        <PanelHeader
          icon={CalendarClock}
          title="Coverage and reorder plan"
          description="Reorder point uses a safety stock of 2 days. Suggested quantity covers lead time plus 2 days."
          actions={
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status="good">7d+</StatusBadge>
              <StatusBadge status="warning">4–7d</StatusBadge>
              <StatusBadge status="critical">&lt;4d</StatusBadge>
            </div>
          }
        />
        {productList.length > 0 ? (
          <DataTable className={cn("mt-4 transition-opacity", isLoading && "opacity-60")}>
            <THead>
              <tr>
                <TH className="w-10">#</TH>
                <TH>Product</TH>
                <TH>Store</TH>
                <TH align="right">Units sold</TH>
                <TH align="right">Avg daily demand</TH>
                <TH align="right">On hand</TH>
                <TH align="right">Reorder point</TH>
                <TH>Days of coverage</TH>
                <TH>Order</TH>
                <TH align="right">Suggested qty</TH>
                <TH align="right">Lost sales</TH>
              </tr>
            </THead>
            <TBody>
              {productList.map((product, index) => {
                const suggested = Math.round(
                  parseFloat(product.avg_daily_demand) *
                    (parseFloat(product.lead_time_days) + 2) -
                    parseFloat(product.stock_on_hand)
                );
                const loss =
                  (product.total_units_sold - product.stock_on_hand) * product.list_price;
                return (
                  <TR key={`${product.sku_id}-${product.store_id}-${index}`}>
                    <TD className="text-muted-foreground tabular-nums">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </TD>
                    <TD>
                      <p className="max-w-56 truncate font-medium text-foreground">
                        {product.sku_name ?? "—"}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {product.sku_id ?? "—"}
                      </p>
                    </TD>
                    <TD>
                      <p className="text-foreground">{product.city ?? "—"}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {product.store_id ?? "—"}
                      </p>
                    </TD>
                    <TD align="right">{product.total_units_sold ?? "—"}</TD>
                    <TD align="right">{product.avg_daily_demand ?? "—"}</TD>
                    <TD align="right" className="font-semibold">
                      {product.stock_on_hand ?? "—"}
                    </TD>
                    <TD align="right">{Math.round(product.rop) ?? "—"}</TD>
                    <TD>
                      <CoverageBadge doc={product.doc} />
                    </TD>
                    <TD>
                      <OrderBadge dayUntilOrder={product.day_until_order} />
                    </TD>
                    <TD align="right" className="font-semibold text-primary">
                      {suggested > 0 ? fmt.int(suggested) : "—"}
                    </TD>
                    <TD
                      align="right"
                      className={loss > 0 ? "font-medium text-critical-ink" : "text-muted-foreground"}
                    >
                      {fmt.money2(loss)}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </DataTable>
        ) : (
          <div className="p-5">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-11" />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="No products for this date"
                description="Pick another date, store or city."
              />
            )}
          </div>
        )}
        <div className="border-t px-3 py-3">
          <PaginationComponent
            numberOfPages={totalPages}
            currentPage={currentPage}
            controlPage={setCurrentPage}
          />
        </div>
      </Panel>
    </div>
  );
};
