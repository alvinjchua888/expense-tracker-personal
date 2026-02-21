import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BudgetScoreResponse {
  currentMonth: {
    year: number;
    month: number;
    score: number;
    descriptor: string;
    descriptorEmoji: string;
    color: string;
  };
  previousMonth: {
    score: number;
    change: number;
  } | null;
}

interface BudgetScoreWidgetProps {
  className?: string;
}

export function BudgetScoreWidget({ className = "" }: BudgetScoreWidgetProps) {
  const { data, isLoading } = useQuery<BudgetScoreResponse>({
    queryKey: ["/api/analytics/budget-score"],
  });

  if (isLoading) return <Skeleton className={`h-32 ${className}`} />;

  const score = data?.currentMonth?.score ?? 0;
  const color = data?.currentMonth?.color ?? "#6B7280";
  const descriptor = data?.currentMonth?.descriptor ?? "Set up budgets to track";
  const emoji = data?.currentMonth?.descriptorEmoji ?? "📊";
  const change = data?.previousMonth?.change;
  const hasBudgets = score > 0 || data?.currentMonth?.descriptor?.includes("crushing");

  // Calculate the stroke-dashoffset for the circular progress
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <span className="font-semibold text-sm">Budget Score</span>
          </div>
          <Link href="/budget-score">
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              View details →
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Circular Gauge */}
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-muted"
              />
              {/* Progress circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            {/* Score text in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span 
                className="text-2xl font-bold"
                style={{ color: hasBudgets ? color : undefined }}
              >
                {hasBudgets ? score : "—"}
              </span>
            </div>
          </div>

          {/* Score info */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">
              {hasBudgets ? "This Month" : "No budgets set"}
            </p>
            <p className="text-sm font-medium" style={{ color: hasBudgets ? color : undefined }}>
              {descriptor}
            </p>
            
            {/* Change indicator */}
            {hasBudgets && change !== undefined && change !== null && (
              <div className="flex items-center gap-1 mt-2">
                {change > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : change < 0 ? (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                ) : (
                  <Minus className="w-3 h-3 text-muted-foreground" />
                )}
                <span className={`text-xs ${
                  change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-muted-foreground"
                }`}>
                  {change > 0 ? "+" : ""}{change} vs last month
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
