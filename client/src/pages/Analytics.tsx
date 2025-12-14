import { DateRangePicker } from "@/components/DateRangePicker";
import {
  SpendingTrendChart,
  CategoryPieChart,
  MonthlyComparisonChart,
  CategoryBarChart,
} from "@/components/AnalyticsCharts";

// todo: remove mock functionality
const weeklyTrendData = [
  { name: "Mon", amount: 120 },
  { name: "Tue", amount: 85 },
  { name: "Wed", amount: 200 },
  { name: "Thu", amount: 45 },
  { name: "Fri", amount: 150 },
  { name: "Sat", amount: 280 },
  { name: "Sun", amount: 95 },
];

const categoryData = [
  { name: "Groceries", value: 450 },
  { name: "Transport", value: 280 },
  { name: "Dining", value: 320 },
  { name: "Utilities", value: 180 },
  { name: "Entertainment", value: 120 },
];

const monthlyComparisonData = [
  { name: "Jan", thisYear: 1200, lastYear: 1100 },
  { name: "Feb", thisYear: 980, lastYear: 1050 },
  { name: "Mar", thisYear: 1450, lastYear: 1200 },
  { name: "Apr", thisYear: 1100, lastYear: 950 },
  { name: "May", thisYear: 1320, lastYear: 1180 },
  { name: "Jun", thisYear: 890, lastYear: 1020 },
];

const topCategoriesData = [
  { name: "Groceries", amount: 450 },
  { name: "Dining", amount: 320 },
  { name: "Transport", amount: 280 },
  { name: "Utilities", amount: 180 },
  { name: "Entertainment", amount: 120 },
];

export default function Analytics() {
  return (
    <div className="space-y-6" data-testid="analytics-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Visualize your spending patterns and trends
          </p>
        </div>
        <DateRangePicker onRangeChange={(range) => console.log("Range:", range)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingTrendChart data={weeklyTrendData} title="Weekly Spending" />
        <CategoryPieChart data={categoryData} title="Spending by Category" />
        <MonthlyComparisonChart
          data={monthlyComparisonData}
          title="Year over Year Comparison"
        />
        <CategoryBarChart data={topCategoriesData} title="Top Spending Categories" />
      </div>
    </div>
  );
}
