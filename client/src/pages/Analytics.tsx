import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  SpendingTrendChart,
  CategoryPieChart,
  CategoryBarChart,
  SummaryStatsCards,
  MonthComparisonCard,
  WeeklyBreakdownChart,
} from "@/components/AnalyticsCharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCurrency } from "@/hooks/useCurrency";
import { Mail, ChevronLeft, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type PeriodView = "year" | "month" | "day";

export default function Analytics() {
  const [periodView, setPeriodView] = useState<PeriodView>("year");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const { toast } = useToast();
  const { symbol, convert } = useCurrency();

  const { data: periodData = [], isLoading: periodLoading } = useQuery<{ period: string; total: number; count: number }[]>({
    queryKey: ["/api/analytics/period-spending", periodView, selectedYear, selectedMonth],
    queryFn: async () => {
      const params = new URLSearchParams({ view: periodView });
      if (periodView === "month" || periodView === "day") params.append("year", String(selectedYear));
      if (periodView === "day") params.append("month", String(selectedMonth));
      const response = await fetch(`/api/analytics/period-spending?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch period spending");
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

  const emailMutation = useMutation({
    mutationFn: async ({ year, email }: { year: number; email: string }) => {
      const res = await apiRequest("POST", "/api/analytics/email-report", { year, email });
      return res.json();
    },
    onSuccess: (data) => {
      const blob = new Blob([data.report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-report-${reportYear}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      try {
        if (data.mailto) {
          window.location.href = data.mailto;
        }
      } catch {
      }

      toast({ title: "Report Generated", description: "Report downloaded. Your email app may also open with the report attached." });
      setEmailDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate report. Please try again.", variant: "destructive" });
    },
  });

  const categoryData = categorySpending
    .filter(c => Number(c.total) > 0)
    .map(c => ({ name: c.name, value: convert(Number(c.total)) }));

  const topCategoriesData = categorySpending
    .filter(c => Number(c.total) > 0)
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 5)
    .map(c => ({ name: c.name, amount: convert(Number(c.total)) }));

  const handleBarClick = (data: any) => {
    if (!data) return;
    const payload = data?.activePayload?.[0]?.payload || data?.payload;
    if (!payload || !payload.name) return;

    if (periodView === "year" && payload.amount > 0) {
      setSelectedYear(parseInt(payload.name));
      setPeriodView("month");
    } else if (periodView === "month" && payload.amount > 0) {
      const monthIndex = MONTH_NAMES.indexOf(payload.name);
      if (monthIndex >= 0) {
        setSelectedMonth(monthIndex + 1);
        setPeriodView("day");
      }
    }
  };

  const handleGoBack = () => {
    if (periodView === "day") {
      setPeriodView("month");
    } else if (periodView === "month") {
      setPeriodView("year");
    }
  };

  const getPeriodTitle = () => {
    if (periodView === "year") return "Yearly Overview";
    if (periodView === "month") return `Monthly Breakdown - ${selectedYear}`;
    return `Daily Breakdown - ${FULL_MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
  };

  const periodTotal = periodData.reduce((sum, d) => sum + convert(d.total), 0);
  const periodTransactions = periodData.reduce((sum, d) => sum + d.count, 0);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const isLoading = periodLoading || categoryLoading || statsLoading || monthlyLoading || weeklyLoading;

  return (
    <div className="space-y-6" data-testid="analytics-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Visualize your spending patterns and trends
          </p>
        </div>
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-email-report">
              <Mail className="h-4 w-4 mr-2" />
              Email Annual Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Email Annual Expense Report</DialogTitle>
              <DialogDescription>
                Generate a summary of your annual expenses and send it to your email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="report-year">Year</Label>
                <Select value={String(reportYear)} onValueChange={(v) => setReportYear(parseInt(v))}>
                  <SelectTrigger data-testid="select-report-year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-email">Email Address</Label>
                <Input
                  id="report-email"
                  type="email"
                  placeholder="your@email.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  data-testid="input-report-email"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => emailMutation.mutate({ year: reportYear, email: emailAddress })}
                disabled={!emailAddress || emailMutation.isPending}
                data-testid="button-send-report"
              >
                {emailMutation.isPending ? "Generating..." : "Send Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              totalSpending={convert(summaryStats.totalSpending)}
              avgPerDay={convert(summaryStats.avgPerDay)}
              highestExpense={convert(summaryStats.highestExpense)}
              transactionCount={summaryStats.transactionCount}
              avgPerTransaction={convert(summaryStats.avgPerTransaction)}
            />
          )}

          <Card data-testid="chart-period-spending">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  {periodView !== "year" && (
                    <Button variant="ghost" size="icon" onClick={handleGoBack} data-testid="button-period-back">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <div>
                    <CardTitle className="text-lg">{getPeriodTitle()}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {symbol}{periodTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} across {periodTransactions} transactions
                      {periodView !== "day" && " - Click a bar to drill down"}
                    </p>
                  </div>
                </div>
                <Tabs value={periodView} onValueChange={(v) => setPeriodView(v as PeriodView)}>
                  <TabsList>
                    <TabsTrigger value="year" data-testid="tab-year">Year</TabsTrigger>
                    <TabsTrigger value="month" data-testid="tab-month">Month</TabsTrigger>
                    <TabsTrigger value="day" data-testid="tab-day">Day</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {periodView === "month" && (
                <div className="flex items-center gap-2 mt-2">
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-28" data-testid="select-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {periodView === "day" && (
                <div className="flex items-center gap-2 mt-2">
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-28" data-testid="select-day-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger className="w-36" data-testid="select-day-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FULL_MONTH_NAMES.map((name, idx) => (
                        <SelectItem key={idx} value={String(idx + 1)}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={periodData.map(d => ({ name: d.period, amount: convert(d.total), count: d.count }))}
                    onClick={periodView !== "day" ? handleBarClick : undefined}
                    style={periodView !== "day" ? { cursor: "pointer" } : undefined}
                  >
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {monthlyComparison && (
              <MonthComparisonCard
                currentMonth={convert(monthlyComparison.currentMonth)}
                previousMonth={convert(monthlyComparison.previousMonth)}
                percentChange={monthlyComparison.percentChange}
              />
            )}
            <WeeklyBreakdownChart
              data={weeklyBreakdown.length > 0 ? weeklyBreakdown.map(d => ({ ...d, total: convert(d.total) })) : [{ dayOfWeek: "No data", total: 0 }]}
              title="Spending by Day of Week"
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
