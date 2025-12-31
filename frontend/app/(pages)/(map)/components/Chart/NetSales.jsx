"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Calendar, Filter, Flag } from "lucide-react"

export const NetSales = () => {
  const [countries, setCountries] = useState([])
  const [yearList, setYearList] = useState([])
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/country`)
      .then((res) => res.json())
      .then((data) => {
        setCountries(data.countries)
      })
  }, [])

  const [selectedCountry, setSelectedCountry] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [netSalesData, setNetSalesData] = useState([])
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  useEffect(() => {
    toast.loading("Fetching data...")
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/net_sales/${selectedCountry}/daily?year=${selectedYear}`)
      .then((res) => res.json())
      .then((data) => {
        setNetSalesData(data.data);
        setStartDate(data.meta.startDate);
        setEndDate(data.meta.endDate);
        setYearList(data.meta.yearList);
      })
      .finally(() => {
        toast.dismiss()
      })
  }, [selectedCountry, selectedYear])

  const years =
    startDate && endDate
      ? Array.from(
        { length: new Date(endDate).getFullYear() - new Date(startDate).getFullYear() + 1 },
        (_, i) => new Date(startDate).getFullYear() + i
      )
      : []
  const yearColors = ["#3b82f6", "#22c55e", "#f97316"]

  return (
    <>
      <div className="mb-4 bg-white p-4 rounded-md shadow-md border border-gray-300 w-full">
        <div className="flex items-center gap-5 text-[20px] mb-5">
          <Filter />
          <span>
            Filter
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="w-full">
            <Label htmlFor="country-select" className="flex items-center gap-3 text-[16px] mb-2"><Flag size={14} />Country</Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry} className="mb-4" id="country-select">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {Array.isArray(countries)
                  ? countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))
                  : null}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full">
            <Label htmlFor="year-select" className="flex items-center gap-3 text-[16px] mb-2"><Calendar size={14} />Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!years.length} className="mb-4" id="year-select">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {Array.isArray(yearList)
                  ? yearList.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))
                  : null}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="bg-white p-5 rounded-md shadow-md border border-gray-300 w-full">
        <div className="text-center">Net Sales over time</div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={netSalesData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              minTickGap={20}
            />

            <YAxis tick={{ fontSize: 12 }} />

            <Tooltip />

            {years.map((year, index) => (
              <ReferenceArea
                key={year}
                x1={`${year}-01-01`}
                x2={`${year}-12-31`}
                fill={yearColors[index % yearColors.length]}
                fillOpacity={0.1}
                label={{ value: year, position: "insideTop" }}
              />
            ))}

            <Line
              type="monotone"
              dataKey="net_sales"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
