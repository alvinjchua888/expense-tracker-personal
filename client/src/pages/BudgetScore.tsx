import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { TrendingUp, TrendingDown, Minus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useCurrency } from "@/hooks/useCurrency";
import type { CategoryScoreBreakdown } from "@shared/schema";
import * as LucideIcons from "lucide-react";

interface BudgetScoreResponse {
  currentMonth: {
    year: number;
    month: number;
    score: number;
    descriptor: string;
    descriptorEmoji: string;
    breakdown: CategoryScoreBreakdown[];
    color: string;
  };
  previousMonth: {
    score: number;
    change: number;
  } | null;
}

interface ScoreHistoryResponse {
  history: {
    year: number;
    month: number;
    score: number;
    calculatedAt: string;
  }[];
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#10B981";
  if (score >= 70) return "#3B82F6";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

function getMonthName(month: number): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[month - 1] || "";
}

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComponent) {
    return <LucideIcons.Circle className={className} />;
  }
  return <IconComponent className={className} />;
}

export default function BudgetScore() {
  const { formatAmount } = useCurrency();

  const { data, isLoading } = useQuery<BudgetScoreResponse>({
    queryKey: ["/api/analytics/budget-score"],
  });

  const { data: historyData, isLoading: historyLoading } = useQuery<ScoreHistoryResponse>({
    queryKey: ["/api/analytics/budget-score/history"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const score = data?.currentMonth?.score ?? 0;
  const color = data?.currentMonth?.color ?? "#6B7280";
  const descriptor = data?.currentMonth?.descriptor ?? "Set up budgets to track";
  const emoji = data?.currentMonth?.descriptorEmoji ?? "📊";
  const breakdown = data?.currentMonth?.breakdown ?? [];
  const change = data?.previousMonth?.change;
  const hasBudgets = breakdown.length > 0;

  // Prepare chart data
  const chartData = historyData?.history?.map(h => ({
    name: `${getMonthName(h.month)} ${h.year.toString().slice(2)}`,
    score: h.score,
  })) || [];

  // Calculate the stroke-dashoffset for the circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Budget Score</h1>
          <p className="text-sm text-muted-foreground">Track your monthly budget adherence</p>
        </div>
      </div>

      {/* Main Score Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Large Circular Gauge */}
            <div className="relative w-48 h-48 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-muted"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Score text in center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span 
                  className="text-5xl font-bold"
                  style={{ color: hasBudgets ? color : undefined }}
                >
                  {hasBudgets ? score : "—"}
                </span>
                <span className="text-sm text-muted-foreground">out of 100</span>
              </div>
            </div>

            {/* Score Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="text-4xl">{emoji}</span>
                <span 
                  className="text-2xl font-semibold"
                  style={{ color: hasBudgets ? color : undefined }}
                >
                  {descriptor}
                </span>
              </div>

              {/* Change indicator */}
              {hasBudgets && change !== undefined && change !== null && (
                <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                  {change > 0 ? (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        +{change} from last month
                      </span>
                    </div>
                  ) : change < 0 ? (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">
                        {change} from last month
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted">
                      <Minus className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        No change from last month
                      </span>
                    </div>
                  )}
                </div>
              )}

              {!hasBudgets && (
                <Link href="/budgets">
                  <Button className="mt-4">Set Up Budgets</Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {hasBudgets && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>How each budgeted category contributes to your score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {breakdown.map((cat) => {
              const catColor = getScoreColor(cat.score);
              const percentUsed = cat.budget > 0 ? Math.min(100, (cat.spent / cat.budget) * 100) : 0;
              
              return (
                <div key={cat.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DynamicIcon name={cat.categoryIcon} className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{cat.categoryName}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(cat.weight * 100).toFixed(0)}% weight)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {formatAmount(cat.spent)} / {formatAmount(cat.budget)}
                      </span>
                      <span 
                        className="font-bold text-sm w-8 text-right"
                        style={{ color: catColor }}
                      >
                        {cat.score}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={percentUsed} 
                      className="h-2"
                    />
                    {percentUsed > 100 && (
                      <div 
                        className="absolute top-0 right-0 h-2 bg-red-500 rounded-r-full"
                        style={{ width: `${Math.min(20, percentUsed - 100)}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Historical Trend */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
            <CardDescription>Your budget score over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}`, 'Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state for no history */}
      {chartData.length <= 1 && hasBudgets && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Keep tracking your budget to see your score trend over time!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
