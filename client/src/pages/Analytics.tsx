import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  SpendingTrendChart,
  CategoryPieChart,
  CategoryBarChart,
  MonthlyComparisonChart,
  MerchantBarChart,
  DayOfWeekChart,
  SpendingForecastChart,
} from "@/components/AnalyticsCharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const { data: spendingTrend = [], isLoading: trendLoading } = useQuery<{ date: string; total: number }[]>({
    queryKey: ["/api/analytics/spending-trend", dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      const url = `/api/analytics/spending-trend${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch spending trend");
      return response.json();
    },
  });

  const { data: categorySpending = [], isLoading: categoryLoading } = useQuery<{ categoryId: number; name: string; total: number }[]>({
    queryKey: ["/api/analytics/category-spending"],
  });

  const { data: monthlyComparison = [], isLoading: monthlyLoading } = useQuery<{ month: string; thisYear: number; lastYear: number }[]>({
    queryKey: ["/api/analytics/monthly-comparison"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/monthly-comparison");
      if (!response.ok) throw new Error("Failed to fetch monthly comparison");
      return response.json();
    },
  });

  const { data: merchantSpending = [], isLoading: merchantLoading } = useQuery<{ merchant: string; total: number; count: number }[]>({
    queryKey: ["/api/analytics/merchant-spending", dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      params.append("limit", "10");
      const url = `/api/analytics/merchant-spending?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch merchant spending");
      return response.json();
    },
  });

  const { data: dayOfWeekSpending = [], isLoading: dayOfWeekLoading } = useQuery<{ day: string; average: number; total: number }[]>({
    queryKey: ["/api/analytics/day-of-week-spending"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/day-of-week-spending");
      if (!response.ok) throw new Error("Failed to fetch day of week spending");
      return response.json();
    },
  });

  const { data: spendingForecast = [], isLoading: forecastLoading } = useQuery<{ period: string; actual: number | null; forecast: number }[]>({
    queryKey: ["/api/analytics/spending-forecast"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/spending-forecast");
      if (!response.ok) throw new Error("Failed to fetch spending forecast");
      return response.json();
    },
  });

  const trendData = spendingTrend.map(item => ({
    name: new Date(item.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    amount: Number(item.total),
  }));

  const categoryData = categorySpending
    .filter(c => Number(c.total) > 0)
    .map(c => ({
      name: c.name,
      value: Number(c.total),
    }));

  const topCategoriesData = categorySpending
    .filter(c => Number(c.total) > 0)
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 5)
    .map(c => ({
      name: c.name,
      amount: Number(c.total),
    }));

  const monthlyData = monthlyComparison.map(item => ({
    name: item.month,
    thisYear: Number(item.thisYear),
    lastYear: Number(item.lastYear),
  }));

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const isLoading = trendLoading || categoryLoading || monthlyLoading || merchantLoading || dayOfWeekLoading || forecastLoading;

  return (
    <div className="space-y-6" data-testid="analytics-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Visualize your spending patterns and trends
          </p>
        </div>
        <DateRangePicker onRangeChange={handleDateRangeChange} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingTrendChart
            data={trendData.length > 0 ? trendData : [{ name: "No data", amount: 0 }]}
            title="Spending Over Time"
          />
          <CategoryPieChart
            data={categoryData.length > 0 ? categoryData : [{ name: "No data", value: 0 }]}
            title="Spending by Category"
          />
          <CategoryBarChart
            data={topCategoriesData.length > 0 ? topCategoriesData : [{ name: "No data", amount: 0 }]}
            title="Top Spending Categories"
          />
          <MonthlyComparisonChart
            data={monthlyData.length > 0 ? monthlyData : [{ name: "No data", thisYear: 0, lastYear: 0 }]}
            title="Year-over-Year Comparison"
          />
          <MerchantBarChart
            data={merchantSpending.length > 0 ? merchantSpending : [{ merchant: "No data", total: 0, count: 0 }]}
            title="Top Merchants"
          />
          <DayOfWeekChart
            data={dayOfWeekSpending.length > 0 ? dayOfWeekSpending : [{ day: "No data", average: 0, total: 0 }]}
            title="Spending by Day of Week"
          />
          <div className="lg:col-span-2">
            <SpendingForecastChart
              data={spendingForecast.length > 0 ? spendingForecast : [{ period: "No data", actual: 0, forecast: 0 }]}
              title="Spending Forecast"
            />
          </div>
        </div>
      )}
    </div>
  );
}
