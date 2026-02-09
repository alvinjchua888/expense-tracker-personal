import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useCurrency } from "@/hooks/useCurrency";
import { TrendingUp, TrendingDown, Wallet, Calendar, CreditCard, DollarSign } from "lucide-react";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface CategoryData {
  name: string;
  value: number;
}

interface TrendData {
  name: string;
  amount: number;
}

interface SpendingTrendChartProps {
  data: TrendData[];
  title?: string;
}

export function SpendingTrendChart({ data, title = "Spending Trend" }: SpendingTrendChartProps) {
  const { symbol } = useCurrency();
  return (
    <Card data-testid="chart-spending-trend">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${symbol}${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, "Amount"]}
              />
              <Bar
                dataKey="amount"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface CategoryPieChartProps {
  data: CategoryData[];
  title?: string;
}

export function CategoryPieChart({ data, title = "Spending by Category" }: CategoryPieChartProps) {
  const { symbol } = useCurrency();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card data-testid="chart-category-pie">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center">
          <div className="w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [
                    `${symbol}${value.toFixed(2)} (${((value / total) * 100).toFixed(1)}%)`,
                    "",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 space-y-2">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="flex-1 capitalize truncate">{item.name}</span>
                <span className="font-medium tabular-nums">
                  {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MonthlyComparisonData {
  name: string;
  thisYear: number;
  lastYear: number;
}

interface MonthlyComparisonChartProps {
  data: MonthlyComparisonData[];
  title?: string;
}

export function MonthlyComparisonChart({
  data,
  title = "Monthly Comparison",
}: MonthlyComparisonChartProps) {
  const { symbol } = useCurrency();
  return (
    <Card data-testid="chart-monthly-comparison">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${symbol}${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${symbol}${value.toFixed(2)}`]}
              />
              <Legend />
              <Bar
                dataKey="thisYear"
                name="This Year"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="lastYear"
                name="Last Year"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface CategoryBarData {
  name: string;
  amount: number;
}

interface CategoryBarChartProps {
  data: CategoryBarData[];
  title?: string;
}

export function CategoryBarChart({ data, title = "Top Categories" }: CategoryBarChartProps) {
  const { symbol } = useCurrency();
  return (
    <Card data-testid="chart-category-bar">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${symbol}${value}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, "Amount"]}
              />
              <Bar
                dataKey="amount"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface SummaryStatsProps {
  totalSpending: number;
  avgPerDay: number;
  highestExpense: number;
  transactionCount: number;
  avgPerTransaction: number;
}

export function SummaryStatsCards({ totalSpending, avgPerDay, highestExpense, transactionCount, avgPerTransaction }: SummaryStatsProps) {
  const { symbol } = useCurrency();
  const stats = [
    { label: "Total Spending", value: totalSpending, icon: Wallet, format: "currency" },
    { label: "Avg. per Day", value: avgPerDay, icon: Calendar, format: "currency" },
    { label: "Highest Expense", value: highestExpense, icon: DollarSign, format: "currency" },
    { label: "Transactions", value: transactionCount, icon: CreditCard, format: "number" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="summary-stats-cards">
      {stats.map((stat) => (
        <Card key={stat.label} data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <stat.icon className="h-4 w-4" />
              <span className="text-sm">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {stat.format === "currency" 
                ? `${symbol}${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : stat.value.toLocaleString()
              }
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface MonthComparisonProps {
  currentMonth: number;
  previousMonth: number;
  percentChange: number;
}

export function MonthComparisonCard({ currentMonth, previousMonth, percentChange }: MonthComparisonProps) {
  const { symbol } = useCurrency();
  const isIncrease = percentChange > 0;
  const isDecrease = percentChange < 0;
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long' });
  const previousMonthName = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('en-US', { month: 'long' });

  return (
    <Card data-testid="month-comparison-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Monthly Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{currentMonthName} (This Month)</span>
            <span className="text-xl font-bold tabular-nums">
              {symbol}{currentMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{previousMonthName} (Last Month)</span>
            <span className="text-lg tabular-nums text-muted-foreground">
              {symbol}{previousMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center gap-2">
              {isIncrease && <TrendingUp className="h-5 w-5 text-destructive" />}
              {isDecrease && <TrendingDown className="h-5 w-5 text-green-500" />}
              {!isIncrease && !isDecrease && <div className="h-5 w-5" />}
              <span className={`text-lg font-semibold ${isIncrease ? 'text-destructive' : isDecrease ? 'text-green-500' : ''}`}>
                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                {isIncrease ? 'more than last month' : isDecrease ? 'less than last month' : 'same as last month'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface WeeklyBreakdownData {
  dayOfWeek: string;
  total: number;
}

interface WeeklyBreakdownChartProps {
  data: WeeklyBreakdownData[];
  title?: string;
}

export function WeeklyBreakdownChart({ data, title = "Spending by Day of Week" }: WeeklyBreakdownChartProps) {
  const { symbol } = useCurrency();
  const chartData = data.map(d => ({
    name: d.dayOfWeek.slice(0, 3),
    amount: d.total,
  }));

  return (
    <Card data-testid="chart-weekly-breakdown">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${symbol}${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, "Amount"]}
              />
              <Bar
                dataKey="amount"
                fill="hsl(var(--chart-3))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
