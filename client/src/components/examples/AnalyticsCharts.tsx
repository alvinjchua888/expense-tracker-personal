import {
  SpendingTrendChart,
  CategoryPieChart,
  MonthlyComparisonChart,
  CategoryBarChart,
} from "../AnalyticsCharts";

export default function AnalyticsChartsExample() {
  // todo: remove mock functionality
  const trendData = [
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
    { name: "Food", value: 320 },
    { name: "Utilities", value: 180 },
    { name: "Entertainment", value: 120 },
  ];

  const monthlyData = [
    { name: "Jan", thisYear: 1200, lastYear: 1100 },
    { name: "Feb", thisYear: 980, lastYear: 1050 },
    { name: "Mar", thisYear: 1450, lastYear: 1200 },
    { name: "Apr", thisYear: 1100, lastYear: 950 },
  ];

  const barData = [
    { name: "Groceries", amount: 450 },
    { name: "Food", amount: 320 },
    { name: "Transport", amount: 280 },
    { name: "Utilities", amount: 180 },
    { name: "Entertainment", amount: 120 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      <SpendingTrendChart data={trendData} />
      <CategoryPieChart data={categoryData} />
      <MonthlyComparisonChart data={monthlyData} />
      <CategoryBarChart data={barData} />
    </div>
  );
}
