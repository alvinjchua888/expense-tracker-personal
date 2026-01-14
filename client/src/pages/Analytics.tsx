import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  SpendingTrendChart,
  CategoryPieChart,
  CategoryBarChart,
  SummaryStatsCards,
  MonthComparisonCard,
  WeeklyBreakdownChart,
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

  const { data: summaryStats, isLoading: statsLoading } = useQuery<{
    totalSpending: number;
    avgPerDay: number;
    highestExpense: number;
    transactionCount: number;
    avgPerTransaction: number;
  }>({
    queryKey: ["/api/analytics/summary-stats"],
  });

  const { data: monthlyComparison, isLoading: monthlyLoading } = useQuery<{
    currentMonth: number;
    previousMonth: number;
    percentChange: number;
  }>({
    queryKey: ["/api/analytics/monthly-comparison"],
  });

  const { data: weeklyBreakdown = [], isLoading: weeklyLoading } = useQuery<{ dayOfWeek: string; total: number }[]>({
    queryKey: ["/api/analytics/weekly-breakdown"],
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

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const isLoading = trendLoading || categoryLoading || statsLoading || monthlyLoading || weeklyLoading;

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
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {summaryStats && (
            <SummaryStatsCards
              totalSpending={summaryStats.totalSpending}
              avgPerDay={summaryStats.avgPerDay}
              highestExpense={summaryStats.highestExpense}
              transactionCount={summaryStats.transactionCount}
              avgPerTransaction={summaryStats.avgPerTransaction}
            />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {monthlyComparison && (
              <MonthComparisonCard
                currentMonth={monthlyComparison.currentMonth}
                previousMonth={monthlyComparison.previousMonth}
                percentChange={monthlyComparison.percentChange}
              />
            )}
            <WeeklyBreakdownChart 
              data={weeklyBreakdown.length > 0 ? weeklyBreakdown : [{ dayOfWeek: "No data", total: 0 }]}
              title="Spending by Day of Week"
            />
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
          </div>
        </div>
      )}
    </div>
  );
}
