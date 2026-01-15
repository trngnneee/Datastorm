import { create } from "zustand";

// Calculate default date range (1 month back from today)
const getDefaultDates = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
};

const defaultDates = getDefaultDates();

export const useFilterStore = create((set) => ({
  countries: [],
  yearList: [],
  selectedCountry: "all",
  selectedYear: "2021",
  selectedMonth: "1",
  startDate: defaultDates.startDate,
  endDate: defaultDates.endDate,
  setCountries: (countries) => set({ countries }),
  setYearList: (yearList) => set({ yearList: yearList }),
  setSelectedCountry: (country) => set({ selectedCountry: country }),
  setSelectedYear: (year) => set({ selectedYear: year }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
}));
