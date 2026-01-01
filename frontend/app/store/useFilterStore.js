import { create } from "zustand"

export const useFilterStore = create((set) => ({
  countries: [],
  yearList: [],
  selectedCountry: "all",
  selectedYear: "2021",
  selectedMonth: "1",
  startDate: null,
  endDate: null,
  setCountries: (countries) => set({ countries }),
  setYearList: (yearList) => set({ yearList: yearList }),
  setSelectedCountry: (country) => set({ selectedCountry: country }),
  setSelectedYear: (year) => set({ selectedYear: year }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date })
}))
