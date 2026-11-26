// DataStorm mock API — local preview only.
//
// Serves deterministic fake data with the same shapes as backend/app/main.py
// for every endpoint the frontend calls. No database, no dependencies.
//
//   node mock-api/server.mjs            # http://localhost:8000
//   PORT=8010 MOCK_LATENCY_MS=0 node mock-api/server.mjs

import http from "node:http";

const PORT = Number(process.env.PORT || 8000);
const LATENCY = Number(process.env.MOCK_LATENCY_MS ?? 250);

/* ------------------------------------------------------------------ */
/* Seeded randomness so every reload shows the same numbers            */
/* ------------------------------------------------------------------ */

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = typeof seed === "number" ? seed : hash(String(seed));
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const between = (r, min, max) => min + r() * (max - min);
const int = (r, min, max) => Math.floor(between(r, min, max + 1));

/* ------------------------------------------------------------------ */
/* Master data                                                         */
/* ------------------------------------------------------------------ */

const STORES = [
  ["ST001", "Berlin", "Germany", 52.52, 13.405],
  ["ST002", "Munich", "Germany", 48.137, 11.575],
  ["ST003", "Hamburg", "Germany", 53.551, 9.993],
  ["ST004", "Paris", "France", 48.857, 2.352],
  ["ST005", "Lyon", "France", 45.764, 4.835],
  ["ST006", "Marseille", "France", 43.296, 5.37],
  ["ST007", "Milan", "Italy", 45.464, 9.19],
  ["ST008", "Rome", "Italy", 41.903, 12.496],
  ["ST009", "Naples", "Italy", 40.852, 14.268],
  ["ST010", "Madrid", "Spain", 40.417, -3.704],
  ["ST011", "Barcelona", "Spain", 41.385, 2.173],
  ["ST012", "Valencia", "Spain", 39.47, -0.376],
  ["ST013", "Amsterdam", "Netherlands", 52.37, 4.895],
  ["ST014", "Rotterdam", "Netherlands", 51.924, 4.478],
  ["ST015", "Warsaw", "Poland", 52.23, 21.012],
  ["ST016", "Krakow", "Poland", 50.065, 19.945],
].map(([store_id, city, country, lat, lng]) => ({ store_id, city, country, lat, lng }));

const COUNTRIES = [...new Set(STORES.map((s) => s.country))];
const CITIES = STORES.map((s) => s.city);

const COUNTRY_WEIGHT = {
  Germany: 0.24,
  France: 0.21,
  Italy: 0.17,
  Spain: 0.16,
  Netherlands: 0.12,
  Poland: 0.1,
};

const CATEGORIES = {
  Beverages: ["Sparkling Water 1L", "Cold Brew Coffee 250ml", "Orange Juice 1L", "Green Tea 500ml"],
  Snacks: ["Sea Salt Crisps 150g", "Dark Chocolate Bar 100g", "Mixed Nuts 200g", "Oat Cookies 300g"],
  Dairy: ["Greek Yogurt 500g", "Whole Milk 1L", "Aged Cheddar 200g", "Butter 250g"],
  Bakery: ["Sourdough Loaf", "Butter Croissants x4", "Rye Bread 500g", "Bagels x6"],
  "Personal Care": ["Shampoo 400ml", "Toothpaste 75ml", "Body Wash 500ml", "Hand Cream 75ml"],
  Household: ["Dish Soap 750ml", "Laundry Pods x30", "Paper Towels x6", "Glass Cleaner 500ml"],
  "Frozen Foods": ["Margherita Pizza", "Garden Peas 1kg", "Vanilla Ice Cream 1L", "Fish Fillets 400g"],
};
const CATEGORY_NAMES = Object.keys(CATEGORIES);
const BRANDS = ["Aurora", "Nordvik", "Brightway", "Casa Verde", "Mistral", "Polaris"];
const SUPPLIERS = Array.from({ length: 14 }, (_, i) => `SUP-${String(i + 1).padStart(2, "0")}`);
const CHANNELS = ["E-commerce", "Hypermarket", "Convenience", "Wholesale"];

// One SKU per (category, brand) so every forecast filter combo has products.
const SKUS = [];
CATEGORY_NAMES.forEach((category, ci) => {
  BRANDS.forEach((brand, bi) => {
    const r = rng(`sku-${category}-${brand}`);
    const names = CATEGORIES[category];
    const count = 1 + (r() > 0.6 ? 1 : 0);
    for (let k = 0; k < count; k++) {
      const n = SKUS.length;
      SKUS.push({
        sku_id: `SKU-${1001 + n}`,
        sku_name: `${brand} ${names[(bi + k + ci) % names.length]}`,
        category,
        brand,
        supplier_id: SUPPLIERS[(ci * 3 + bi + k) % SUPPLIERS.length],
        list_price: round(between(r, 1.2, 14.9)),
      });
    }
  });
});

const CATEGORY_PROFILE = Object.fromEntries(
  CATEGORY_NAMES.map((c) => {
    const r = rng(`cat-${c}`);
    return [
      c,
      {
        share: between(r, 0.6, 1.6),
        margin: between(r, 18, 42),
        discount: between(r, 4, 16),
        tempSensitivity: c === "Beverages" || c === "Frozen Foods" ? 0.9 : c === "Bakery" ? -0.3 : between(r, -0.2, 0.3),
      },
    ];
  })
);

/* ------------------------------------------------------------------ */
/* Time helpers                                                        */
/* ------------------------------------------------------------------ */

const DATA_START = new Date("2021-01-01T00:00:00Z");
const DATA_END = new Date("2023-12-31T00:00:00Z");
const iso = (d) => d.toISOString().slice(0, 10);

function daysInScope(year = "all", month = "all") {
  const out = [];
  for (let d = new Date(DATA_START); d <= DATA_END; d.setUTCDate(d.getUTCDate() + 1)) {
    if (year !== "all" && d.getUTCFullYear() !== Number(year)) continue;
    if (month !== "all" && d.getUTCMonth() + 1 !== Number(month)) continue;
    out.push(new Date(d));
  }
  return out;
}

const countryFactor = (country = "all") =>
  country === "all" ? 1 : COUNTRY_WEIGHT[country] ?? 0.1;

function temperatureOn(d, country = "all") {
  const doy = (d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000;
  const south = ["Spain", "Italy"].includes(country) ? 5 : country === "Poland" ? -2 : 0;
  const r = rng(`temp-${iso(d)}-${country}`);
  return round(11 + south + 11 * Math.sin(((doy - 110) / 365) * 2 * Math.PI) + between(r, -3, 3), 1);
}

function rainOn(d, country = "all") {
  const r = rng(`rain-${iso(d)}-${country}`);
  const x = r();
  return x < 0.55 ? 0 : round(between(r, 0.2, 1) ** 2 * 22, 1);
}

function dailySales(d, country = "all") {
  const r = rng(`sales-${iso(d)}-${country}`);
  const dow = d.getUTCDay();
  const weekly = dow === 6 ? 1.28 : dow === 5 ? 1.15 : dow === 0 ? 0.82 : 1;
  const yearGrowth = 1 + (d.getUTCFullYear() - 2021) * 0.08;
  const december = d.getUTCMonth() === 11 ? 1.22 : 1;
  const temp = temperatureOn(d, country);
  const rain = rainOn(d, country);
  const weather = 1 + (temp - 12) * 0.006 - rain * 0.006;
  return 42000 * countryFactor(country) * weekly * yearGrowth * december * weather * between(r, 0.9, 1.1);
}

/* ------------------------------------------------------------------ */
/* Endpoint handlers                                                   */
/* ------------------------------------------------------------------ */

function salesSummary(country, year, month) {
  const days = daysInScope(year, month);
  const total = days.reduce((s, d) => s + dailySales(d, country), 0);
  return { days, total };
}

const handlers = {
  "GET /country": () => ({ countries: COUNTRIES }),
  "GET /store/list": () => ({ data: STORES.map((s) => s.store_id) }),
  "GET /city/list": () => ({ data: CITIES }),
  "GET /category/list": () => ({ data: CATEGORY_NAMES }),
  "GET /brand/list": () => ({ data: BRANDS }),

  "GET /product/list": (q) => ({
    data: SKUS.filter(
      (s) => (!q.category || s.category === q.category) && (!q.brand || s.brand === q.brand)
    ).map(({ sku_id, sku_name }) => ({ sku_id, sku_name })),
  }),

  "GET /analytics/kpi": (q) => {
    const country = q.country || "all";
    const { total } = salesSummary(country, "all", "all");
    const r = rng(`kpi-${country}`);
    const promo = total * between(r, 0.24, 0.34);
    return {
      data: {
        total_transactions: Math.round(1_095 * STORES.length * SKUS.length * 0.12 * countryFactor(country)),
        stockout_rate_pct: round(between(r, 2.1, 6.8), 2),
        promo_contribution_pct: round((promo / total) * 100, 2),
        total_sales: round(total, 2),
        promo_sales: round(promo, 2),
      },
    };
  },

  "GET /analytics/revenue": (q) => {
    const days = daysInScope(q.year, q.month);
    const data = days.map((d) => {
      const revenue = dailySales(d, q.country);
      return {
        date: iso(d),
        revenue: round(revenue, 2),
        units: Math.round(revenue / 6.4),
        stores: q.country && q.country !== "all" ? STORES.filter((s) => s.country === q.country).length : STORES.length,
      };
    });
    const total = data.reduce((s, x) => s + x.revenue, 0);
    return {
      data,
      summary: {
        total_revenue: round(total, 2),
        total_units: data.reduce((s, x) => s + x.units, 0),
        avg_daily_revenue: round(total / (data.length || 1), 2),
        period_days: data.length,
      },
    };
  },

  "GET /analytics/profit": (q) => {
    const { total, days } = salesSummary(q.country, q.year, q.month || "all");
    const shares = CATEGORY_NAMES.map((c) => CATEGORY_PROFILE[c].share);
    const sum = shares.reduce((a, b) => a + b, 0);
    return {
      data: CATEGORY_NAMES.map((c, i) => {
        const revenue = (total * shares[i]) / sum;
        const margin = CATEGORY_PROFILE[c].margin;
        const cost = revenue * (1 - margin / 100);
        return {
          category: c,
          revenue: round(revenue, 2),
          cost: round(cost, 2),
          profit: round(revenue - cost, 2),
          margin_pct: round(margin, 2),
          days: days.length,
        };
      }),
    };
  },

  "GET /analytics/channel": (q) => {
    const { total } = salesSummary(q.country, q.year, q.month);
    const weights = [0.31, 0.38, 0.19, 0.12];
    let pctLeft = 100;
    return {
      data: CHANNELS.map((channel, i) => {
        const r = rng(`ch-${channel}-${q.country}-${q.year}-${q.month}`);
        const pct = i === CHANNELS.length - 1 ? round(pctLeft, 1) : round(weights[i] * 100 + between(r, -2, 2), 1);
        pctLeft -= pct;
        const sales = (total * pct) / 100;
        return {
          channel,
          sales: round(sales, 2),
          sales_pct: pct,
          units: Math.round(sales / between(r, 5, 8)),
          stores: int(r, 6, STORES.length),
          products: int(r, 28, SKUS.length),
          avg_discount_pct: round(between(r, 3, 14), 1),
          stockout_count: int(r, 40, 480),
        };
      }),
    };
  },

  "GET /analytics/channel/daily": (q) => {
    const weights = { "E-commerce": 0.31, Hypermarket: 0.38, Convenience: 0.19, Wholesale: 0.12 };
    const data = [];
    daysInScope(q.year, q.month).forEach((d) => {
      const base = dailySales(d, q.country);
      CHANNELS.forEach((channel) => {
        const r = rng(`chd-${iso(d)}-${channel}-${q.country}`);
        const weekendBoost = channel === "E-commerce" && d.getUTCDay() === 0 ? 1.25 : 1;
        data.push({ date: iso(d), channel, sales: round(base * weights[channel] * weekendBoost * between(r, 0.88, 1.12), 2) });
      });
    });
    return { data };
  },

  "GET /analytics/pricing": (q) => {
    const { total } = salesSummary(q.country, q.year, "all");
    const shares = CATEGORY_NAMES.map((c) => CATEGORY_PROFILE[c].share);
    const sum = shares.reduce((a, b) => a + b, 0);
    return {
      data: CATEGORY_NAMES.map((c, i) => {
        const p = CATEGORY_PROFILE[c];
        const prices = SKUS.filter((s) => s.category === c).map((s) => s.list_price);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const sales = (total * shares[i]) / sum;
        return {
          category: c,
          avg_list_price: round(avg, 2),
          avg_discount_pct: round(p.discount, 1),
          price_realization: round(1 - p.discount / 100 - 0.01, 3),
          avg_margin_pct: round(p.margin, 1),
          total_sales: round(sales, 2),
          total_units: Math.round(sales / (avg * (1 - p.discount / 100))),
        };
      }),
    };
  },

  "GET /analytics/discount-impact": (q) => ({
    data: CATEGORY_NAMES.map((c) => {
      const r = rng(`disc-${c}-${q.country}-${q.year}`);
      const without = int(r, 18000, 60000) * countryFactor(q.country);
      const lift = between(r, -4, 38);
      const withD = without * (1 + lift / 100) * between(r, 0.35, 0.6);
      const perDiscounted = withD / ((without * between(r, 0.35, 0.6)) || 1);
      const price = 6.5;
      return {
        category: c,
        units_with_discount: Math.round(withD),
        units_without_discount: Math.round(without),
        units_lift_pct: round(lift, 1),
        sales_with_discount: round(withD * price * 0.9, 2),
        sales_without_discount: round(without * price, 2),
        transaction_count_discounted: Math.round(withD / 2.1),
        transaction_count_no_discount: Math.round(without / (2.1 * Math.max(perDiscounted, 0.5))),
      };
    }),
  }),

  "GET /analytics/supplier": (q) => ({
    data: SUPPLIERS.map((supplier_id) => {
      const r = rng(`sup-${supplier_id}-${q.country}-${q.year}`);
      const products = SKUS.filter((s) => s.supplier_id === supplier_id).length || int(r, 1, 4);
      const units = Math.round(int(r, 40000, 260000) * countryFactor(q.country));
      const costPerUnit = between(r, 1.1, 7.8);
      const margin = between(r, 0.08, 0.42);
      const cost = units * costPerUnit;
      const sales = cost / (1 - margin);
      return {
        supplier_id,
        products_supplied: products,
        total_units: units,
        total_cost: round(cost, 2),
        total_sales: round(sales, 2),
        profit: round(sales - cost, 2),
        avg_lead_time_days: round(between(r, 2.5, 11), 2),
        cost_per_unit: round(costPerUnit, 2),
      };
    }),
  }),

  "GET /analytics/inventory-optimization": (q) => {
    const stores = q.country && q.country !== "all" ? STORES.filter((s) => s.country === q.country) : STORES;
    const data = [];
    stores.slice(0, 8).forEach((store) => {
      SKUS.slice(0, 18).forEach((sku) => {
        const r = rng(`inv-${store.store_id}-${sku.sku_id}-${q.year}`);
        const avg = between(r, 2, 26);
        const lead = int(r, 2, 9);
        const safety = Math.round(avg * 2);
        const reorder = Math.round(avg * lead + safety);
        const current = Math.round(reorder * between(r, 0.35, 3.4));
        const dos = current / avg;
        let recommendation = "Optimal";
        let priority = "Low";
        if (current <= reorder) {
          recommendation = "Order Now";
          priority = "High";
        } else if (dos < lead * 1.5) {
          recommendation = "Plan Replenishment";
          priority = "Medium";
        }
        data.push({
          sku_id: sku.sku_id,
          sku_name: sku.sku_name,
          store_id: store.store_id,
          current_stock: current,
          safety_stock: safety,
          reorder_point: reorder,
          days_of_stock: round(dos, 1),
          avg_daily_sales: round(avg, 1),
          lead_time_days: lead,
          recommendation,
          priority,
        });
      });
    });
    const order = { High: 0, Medium: 1, Low: 2 };
    data.sort((a, b) => order[a.priority] - order[b.priority] || a.days_of_stock - b.days_of_stock);
    return {
      data,
      summary: {
        high_priority_count: data.filter((i) => i.priority === "High").length,
        medium_priority_count: data.filter((i) => i.priority === "Medium").length,
        optimal_count: data.filter((i) => i.priority === "Low").length,
      },
    };
  },

  "GET /analytics/weather-correlation": (q) => ({
    data: daysInScope(q.year, q.month).map((d) => {
      const sales = dailySales(d, q.country);
      return {
        date: iso(d),
        temperature: temperatureOn(d, q.country),
        rain_mm: rainOn(d, q.country),
        sales: round(sales, 2),
        units_sold: Math.round(sales / 6.4),
      };
    }),
  }),

  "GET /analytics/weather-by-category": (q) => {
    const segments = ["Cold (<10°C)", "Cool (10-20°C)", "Warm (20-30°C)", "Hot (>30°C)"];
    const data = [];
    segments.forEach((seg, si) => {
      CATEGORY_NAMES.forEach((c) => {
        const r = rng(`wbc-${seg}-${c}-${q.country}-${q.year}`);
        const sens = CATEGORY_PROFILE[c].tempSensitivity;
        const days = [70, 130, 120, 25][si];
        const units = Math.max(500, Math.round(days * 210 * CATEGORY_PROFILE[c].share * (1 + sens * (si - 1.5) * 0.35) * countryFactor(q.country) * between(r, 0.9, 1.1)));
        const sales = units * between(r, 4.5, 9);
        data.push({
          category: c,
          temperature_segment: seg,
          sales: round(sales, 2),
          units,
          avg_sales_per_transaction: round(between(r, 11, 34), 2),
        });
      });
    });
    data.sort((a, b) => b.sales - a.sales);
    return { data };
  },

  "GET /net_sales/location": (q) => {
    const { total } = salesSummary("all", q.year, q.month);
    const stores = q.country && q.country !== "all" ? STORES.filter((s) => s.country === q.country) : STORES;
    return {
      type: "FeatureCollection",
      features: stores.map((s) => {
        const r = rng(`loc-${s.store_id}-${q.year}-${q.month}`);
        const share = (COUNTRY_WEIGHT[s.country] / STORES.filter((x) => x.country === s.country).length) * between(r, 0.7, 1.3);
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [s.lng, s.lat] },
          properties: {
            store_id: s.store_id,
            city: s.city,
            country: s.country,
            net_sales: round(Math.min(1_000_000, total * share * (q.month && q.month !== "all" ? 12 : 1) / 3), 2),
            stock_out_rate: round(between(r, 0.02, 0.85) ** 1.6, 3),
          },
        };
      }),
    };
  },

  "GET /sku/top": (q) => {
    const limit = Number(q.limit || 10);
    const rows = [];
    STORES.forEach((store) =>
      SKUS.forEach((sku) => {
        const r = rng(`top-${store.store_id}-${sku.sku_id}`);
        const units = Math.round(between(r, 900, 9800) * CATEGORY_PROFILE[sku.category].share);
        rows.push({
          sku_id: sku.sku_id,
          sku_name: sku.sku_name,
          supplier_id: sku.supplier_id,
          store_id: store.store_id,
          city: store.city,
          units_sold: units,
          net_sales: round(units * sku.list_price * 0.92, 2),
          stock_opening: int(r, 20, 420),
        });
      })
    );
    rows.sort((a, b) => b.units_sold - a.units_sold);
    return { data: rows.slice(0, limit) };
  },

  "GET /sku/list": (q) => {
    const page = Number(q.page || 1);
    const limit = Number(q.limit || 10);
    const date = q.date || "2021-01-01";
    if (date > "2023-12-31") {
      return {
        code: "error",
        message: "Data is only available up to 2023-12-31",
        data: [],
        pagination: { page, limit, total_count: 0, total_pages: 0 },
      };
    }
    const stores = STORES.filter(
      (s) =>
        (!q.store_id || q.store_id === "all" || s.store_id === q.store_id) &&
        (!q.city || q.city === "all" || s.city === q.city)
    );
    const rows = [];
    stores.forEach((store) =>
      SKUS.forEach((sku) => {
        const r = rng(`doc-${date}-${store.store_id}-${sku.sku_id}`);
        const demand = round(between(r, 1.5, 24), 2);
        const lead = int(r, 2, 9);
        const rop = demand * (lead + 2);
        const stock = Math.round(rop * between(r, 0.3, 2.6));
        rows.push({
          sku_id: sku.sku_id,
          sku_name: sku.sku_name,
          store_id: store.store_id,
          city: store.city,
          total_units_sold: Math.round(demand * int(r, 25, 35)),
          avg_daily_demand: demand,
          stock_on_hand: stock,
          rop: round(rop, 2),
          doc: round(stock / demand, 3),
          day_until_order: round((stock - rop) / demand, 3),
          lead_time_days: lead,
          list_price: sku.list_price,
        });
      })
    );
    const total = rows.length;
    return {
      code: "success",
      message: total ? "OK" : "No SKUs found",
      data: rows.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, total_count: total, total_pages: Math.ceil(total / limit) },
    };
  },

  "GET /stock_alerts": (q) => {
    const rows = [];
    STORES.forEach((store) =>
      SKUS.forEach((sku) => {
        const r = rng(`alert-${store.store_id}-${sku.sku_id}`);
        if (r() > 0.025) return;
        const days = round(between(r, 0.2, 4.5), 2);
        const safety = int(r, 12, 60);
        rows.push({
          sku_id: sku.sku_id,
          sku_name: sku.sku_name,
          store_id: store.store_id,
          city: store.city,
          country: store.country,
          current_stock: int(r, 0, safety),
          safety_stock: safety,
          days_until_stockout: days,
          lead_time_days: int(r, 2, 9),
          recommended_order_qty: int(r, 40, 320),
          urgency: days < 1.5 ? "critical" : "warning",
        });
      })
    );
    rows.sort((a, b) => a.days_until_stockout - b.days_until_stockout);
    return {
      data: rows.filter(
        (a) =>
          (!q.urgency || q.urgency === "all" || a.urgency === q.urgency) &&
          (!q.country || q.country === "all" || a.country === q.country)
      ),
    };
  },

  "GET /unit_sold/daily": (q) => {
    const sku = q.sku_id || "SKU-1001";
    const store = q.store || "ST001";
    return {
      data: daysInScope(q.year || "2023", q.month || "12").map((d) => {
        const r = rng(`usd-${iso(d)}-${sku}-${store}`);
        const dow = d.getUTCDay();
        return { date: iso(d), units_sold: Math.round((dow === 6 ? 34 : dow === 0 ? 20 : 26) * between(r, 0.7, 1.3)) };
      }),
    };
  },

  "POST /predict_7days": (_q, body) => {
    const start = new Date(`${body.start_date || "2024-01-01"}T00:00:00Z`);
    const seed = `${body.sku_id}-${body.store_id}`;
    return {
      data: {
        sku_id: body.sku_id,
        store_id: body.store_id,
        daily_forecasts: Array.from({ length: 7 }, (_, i) => {
          const d = new Date(start);
          d.setUTCDate(d.getUTCDate() + i);
          const r = rng(`pred-${seed}-${i}`);
          const dow = d.getUTCDay();
          return {
            date: iso(d),
            demand: { units_sold: (dow === 6 ? 31 : dow === 0 ? 19 : 24) * between(r, 0.85, 1.15) },
            supply: { lead_time_days: between(r, 3.2, 6.4) },
          };
        }),
      },
    };
  },

  "POST /suggestion/sales_demand": (_q, body) => {
    const rows = body.forecast_data || [];
    const total = rows.reduce((s, x) => s + (x.predicted_unit_sold || 0), 0);
    const peak = rows.reduce((m, x) => (x.predicted_unit_sold > (m?.predicted_unit_sold ?? -1) ? x : m), null);
    return {
      message: `**Expect about ${Math.round(total)} units over the next 7 days** for ${body.sku_id} at ${body.store_id}.

- Demand peaks on **${peak?.date ?? "the weekend"}** (${peak ? Math.round(peak.predicted_unit_sold) : "–"} units); stock shelves the day before.
- Keep at least **2 days of safety stock** (${Math.round((total / 7) * 2)} units) on hand through the week.
- Consider a light promotion mid-week, when forecast demand is lowest.

_Mock suggestion — the real one is generated by Gemini from the forecast._`,
    };
  },

  "POST /suggestion/lead_time": (_q, body) => {
    const rows = body.forecast_data || [];
    const avg = rows.reduce((s, x) => s + (x.predicted_unit_sold || 0), 0) / (rows.length || 1);
    return {
      message: `**Average supplier lead time: ${avg.toFixed(1)} days.**

1. Place the next order **by ${rows[0]?.date ?? "Monday"}** to land before the weekend peak.
2. Lead time varies by about ±1 day across the week; order earlier on longer-lead days.
3. If lead time goes above 6 days, raise the reorder point by one day of demand.

_Mock suggestion — the real one is generated by Gemini from the forecast._`,
    };
  },

  "POST /chatbot": (_q, body) => ({
    code: "success",
    data: {
      answer: `You asked: _"${String(body.message || "").slice(0, 160)}"_

This is the **mock API**, so answers are canned. In the real app, the assistant queries the sales database. A few things you can try in the dashboard:

- **Financial** → profit and margin by category
- **Stock alerts** → what will run out first
- **Advanced analytics → Weather** → how rain and temperature move sales`,
    },
  }),
};

const SLOW = new Set(["POST /suggestion/sales_demand", "POST /suggestion/lead_time", "POST /chatbot", "POST /predict_7days"]);

/* ------------------------------------------------------------------ */
/* HTTP server                                                         */
/* ------------------------------------------------------------------ */

const cache = new Map();

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const key = `${req.method} ${url.pathname.replace(/\/+$/, "") || "/"}`;

  if (key === "GET /" || key === "GET /health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", mock: true, endpoints: Object.keys(handlers) }));
    return;
  }

  const handler = handlers[key];
  if (!handler) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ detail: `Mock API has no ${key}` }));
    return;
  }

  let body = {};
  if (req.method === "POST") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    try {
      body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    } catch {
      body = {};
    }
  }

  const query = Object.fromEntries(url.searchParams);
  const cacheKey = req.method === "GET" ? `${key}?${url.searchParams}` : null;
  let payload = cacheKey ? cache.get(cacheKey) : undefined;
  if (!payload) {
    payload = JSON.stringify(handler(query, body));
    if (cacheKey) cache.set(cacheKey, payload);
  }

  const delay = SLOW.has(key) ? LATENCY * 4 : LATENCY;
  setTimeout(() => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(payload);
  }, delay);
});

server.listen(PORT, () => {
  console.log(`DataStorm mock API on http://localhost:${PORT} (latency ${LATENCY}ms)`);
});
