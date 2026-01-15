import React, { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const StockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");

  useEffect(() => {
    fetchAlerts();
  }, [filterUrgency, selectedCountry]);

  const fetchAlerts = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "critical":
        return "bg-red-50 border-red-300";
      case "warning":
        return "bg-yellow-50 border-yellow-300";
      default:
        return "bg-blue-50 border-blue-300";
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "critical":
        return (
          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            CRITICAL
          </span>
        );
      case "warning":
        return (
          <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
            WARNING
          </span>
        );
      default:
        return (
          <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex gap-4">
        <div>
          <label className="text-sm font-medium">Urgency Filter</label>
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="mt-1 px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warning Only</option>
          </select>
        </div>
        <Button onClick={fetchAlerts} disabled={loading} className="mt-6">
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <TrendingDown className="mx-auto mb-2 opacity-50" />
          <p>No stock alerts at this time</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={`${alert.sku_id}-${alert.store_id}`}
              className={`p-4 border-l-4 rounded ${getUrgencyColor(
                alert.urgency
              )}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {alert.urgency === "critical" && (
                      <AlertTriangle className="text-red-600" size={18} />
                    )}
                    {alert.urgency === "warning" && (
                      <AlertCircle className="text-yellow-600" size={18} />
                    )}
                    <h3 className="font-bold">{alert.sku_name}</h3>
                    {getUrgencyBadge(alert.urgency)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">SKU ID</p>
                      <p className="font-mono">{alert.sku_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Store</p>
                      <p>
                        {alert.store_id} - {alert.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Current Stock</p>
                      <p className="font-bold text-lg">{alert.current_stock}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Safety Stock</p>
                      <p className="font-bold">{alert.safety_stock}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Days Until Stockout</p>
                      <p
                        className={`font-bold ${
                          alert.days_until_stockout < 1
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {alert.days_until_stockout.toFixed(1)} days
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Lead Time</p>
                      <p>{alert.lead_time_days} days</p>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-white rounded border-l-2 border-blue-400">
                    <p className="text-xs text-gray-600 mb-1">
                      Recommended Action:
                    </p>
                    <p className="font-bold text-sm text-blue-700">
                      Order {alert.recommended_order_qty} units immediately
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
