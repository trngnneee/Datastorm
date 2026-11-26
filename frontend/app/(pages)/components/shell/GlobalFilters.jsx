"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, CalendarDays, Check, Globe2, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useFilterStore } from "@/app/store/useFilterStore";
import { useGlobalLoading } from "../../../context/loadingContext";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const monthLabel = (m) =>
  m === "all" || !m ? "All months" : MONTHS[Number(m) - 1] ?? m;

function Field({ id, label, icon: Icon, className, children }) {
  return (
    <div className={`flex min-w-0 flex-1 basis-40 flex-col gap-1.5 ${className ?? ""}`}>
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
      >
        <Icon className="size-3.5" aria-hidden />
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * One filter row that scopes every chart below it. Changes are drafted and
 * applied together, so the page doesn't refetch on every pick.
 */
export function GlobalFilters() {
  const selectedCountry = useFilterStore((s) => s.selectedCountry);
  const selectedYear = useFilterStore((s) => s.selectedYear);
  const selectedMonth = useFilterStore((s) => s.selectedMonth);
  const setSelectedCountry = useFilterStore((s) => s.setSelectedCountry);
  const setSelectedYear = useFilterStore((s) => s.setSelectedYear);
  const setSelectedMonth = useFilterStore((s) => s.setSelectedMonth);
  const countries = useFilterStore((s) => s.countries);
  const setCountries = useFilterStore((s) => s.setCountries);
  const yearList = useFilterStore((s) => s.yearList);
  const startDate = useFilterStore((s) => s.startDate);
  const endDate = useFilterStore((s) => s.endDate);

  const { startLoading, stopLoading, isLoading } = useGlobalLoading();

  const [country, setCountry] = useState(selectedCountry);
  const [year, setYear] = useState(selectedYear);
  const [month, setMonth] = useState(selectedMonth);

  useEffect(() => {
    if (countries?.length) return;
    const fetchData = async () => {
      startLoading();
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/country`);
        const data = await res.json();
        setCountries(data.countries);
      } catch (error) {
        console.error(error);
      } finally {
        stopLoading();
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const years = useMemo(() => {
    if (startDate && endDate) {
      const start = new Date(startDate).getFullYear();
      const end = new Date(endDate).getFullYear();
      return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
    }
    return yearList;
  }, [endDate, startDate, yearList]);

  const dirty =
    country !== selectedCountry || year !== selectedYear || month !== selectedMonth;

  const apply = () => {
    setSelectedCountry(country);
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const reset = () => {
    setCountry(selectedCountry);
    setYear(selectedYear);
    setMonth(selectedMonth);
  };

  return (
    <div className="grid grid-cols-2 items-end gap-3 rounded-2xl border bg-card p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex sm:flex-wrap sm:p-4">
      <Field id="filter-country" label="Country" icon={Globe2} className="col-span-2">
        <Select
          value={country}
          onValueChange={setCountry}
          disabled={!countries?.length}
        >
          <SelectTrigger id="filter-country" className="h-9 w-full rounded-lg bg-card">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {Array.isArray(countries)
              ? countries.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))
              : null}
          </SelectContent>
        </Select>
      </Field>

      <Field id="filter-year" label="Year" icon={Calendar}>
        <Select value={year} onValueChange={setYear} disabled={!years?.length}>
          <SelectTrigger id="filter-year" className="h-9 w-full rounded-lg bg-card">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field id="filter-month" label="Month" icon={CalendarDays}>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger id="filter-month" className="h-9 w-full rounded-lg bg-card">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {MONTHS.map((name, i) => (
              <SelectItem key={name} value={String(i + 1)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="col-span-2 flex w-full items-center justify-end gap-2 sm:w-auto">
        <Button
          variant="ghost"
          onClick={reset}
          disabled={!dirty}
          aria-label="Discard filter changes"
        >
          <RotateCcw aria-hidden />
          <span className="sm:sr-only xl:not-sr-only">Reset</span>
        </Button>
        <Button onClick={apply} disabled={!dirty || isLoading} className="min-w-32">
          <Check aria-hidden />
          Apply filters
        </Button>
      </div>
    </div>
  );
}

/** Read-only summary of the applied scope, shown in the top bar. */
export function ScopeSummary() {
  const selectedCountry = useFilterStore((s) => s.selectedCountry);
  const selectedYear = useFilterStore((s) => s.selectedYear);
  const selectedMonth = useFilterStore((s) => s.selectedMonth);

  const chips = [
    selectedCountry === "all" ? "All countries" : selectedCountry,
    selectedYear === "all" ? "All years" : selectedYear,
    monthLabel(selectedMonth),
  ];

  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Applied filters">
      {chips.map((chip) => (
        <li
          key={chip}
          className="inline-flex h-6 items-center rounded-full border bg-card px-2.5 text-xs font-medium text-foreground/80"
        >
          {chip}
        </li>
      ))}
    </ul>
  );
}
