import {
  BellRing,
  CalendarClock,
  LayoutDashboard,
  Layers3,
  LineChart,
  MapPinned,
  Trophy,
  Wallet,
} from "lucide-react";

/**
 * Single source of truth for navigation + page titles.
 * `filters: true` shows the global Country / Year / Month bar.
 */
export const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      {
        key: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        title: "Overview",
        description: "Headline numbers and a map of everything in DataStorm.",
        filters: false,
      },
    ],
  },
  {
    label: "Monitor",
    items: [
      {
        key: "map",
        label: "Store map",
        icon: MapPinned,
        title: "Store map",
        description: "Net sales and stock-out rate for every store, by location.",
        filters: true,
      },
      {
        key: "financial",
        label: "Financial",
        icon: Wallet,
        title: "Financial performance",
        description: "Sales, promo contribution and profit by category.",
        filters: true,
      },
      {
        key: "top-sku",
        label: "Top SKUs",
        icon: Trophy,
        title: "Top selling SKU-stores",
        description: "The ten SKU and store pairs moving the most units.",
        filters: false,
      },
      {
        key: "alerts",
        label: "Stock alerts",
        icon: BellRing,
        title: "Stock alerts",
        description: "SKUs at or below safety stock, with what to order.",
        filters: false,
      },
      {
        key: "doc",
        label: "Days of coverage",
        icon: CalendarClock,
        title: "Days of coverage",
        description: "How long current stock lasts, and when to reorder.",
        filters: false,
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        key: "analytics",
        label: "Advanced analytics",
        icon: Layers3,
        title: "Advanced analytics",
        description: "Channels, pricing, suppliers, inventory and weather in one place.",
        filters: true,
      },
    ],
  },
  {
    label: "Planning",
    items: [
      {
        key: "forecasting",
        label: "Demand forecast",
        icon: LineChart,
        title: "Demand forecast",
        description: "7-day ML forecast of units sold and supplier lead time.",
        filters: false,
        href: "/forecasting",
      },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export const SECTION_KEYS = NAV_ITEMS.filter((i) => !i.href).map((i) => i.key);

export const hrefFor = (item) =>
  item.href ?? { pathname: "/", query: { section: item.key } };

export function resolveActiveKey(pathname, sectionParam) {
  if (pathname?.startsWith("/forecasting")) return "forecasting";
  return SECTION_KEYS.includes(sectionParam) ? sectionParam : "overview";
}

export const itemByKey = (key) => NAV_ITEMS.find((i) => i.key === key) ?? NAV_ITEMS[0];
