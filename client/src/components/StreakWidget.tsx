import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { UserStreak } from "@shared/schema";

const STREAK_MILESTONES = [7, 30, 100, 365];

function getMilestoneLabel(days: number): string {
  if (days >= 365) return "Year Master";
  if (days >= 100) return "Century Club";
  if (days >= 30) return "Month Warrior";
  if (days >= 7) return "Week Streak";
  return "Building...";
}

function getFlameColor(streak: number): string {
  if (streak >= 100) return "#EC4899";
  if (streak >= 30) return "#8B5CF6";
  if (streak >= 7) return "#F97316";
  return "#6B7280";
}

interface StreakWidgetProps {
  className?: string;
}

export function StreakWidget({ className = "" }: StreakWidgetProps) {
  const { data: streak, isLoading } = useQuery<UserStreak>({
    queryKey: ["/api/streak"],
  });

  if (isLoading) return <Skeleton className={`h-32 ${className}`} />;

  const current = streak?.currentStreak ?? 0;
  const longest = streak?.longestStreak ?? 0;
  const flameColor = getFlameColor(current);
  const nextMilestone = STREAK_MILESTONES.find((m) => m > current);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" style={{ filter: current === 0 ? "grayscale(1)" : "none" }}>
              🔥
            </span>
            <span className="font-semibold text-sm">Tracking Streak</span>
          </div>
          <Link href="/badges">
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              View badges →
            </span>
          </Link>
        </div>

        <div className="flex items-end gap-4 mb-3">
          <div>
            <p className="text-4xl font-bold" style={{ color: current > 0 ? flameColor : undefined }}>
              {current}
            </p>
            <p className="text-xs text-muted-foreground">day streak</p>
          </div>
          {longest > 0 && (
            <div className="mb-1">
              <p className="text-sm font-medium text-muted-foreground">Best: {longest}</p>
            </div>
          )}
        </div>

        {current > 0 && (
          <p className="text-xs font-medium mb-3" style={{ color: flameColor }}>
            {getMilestoneLabel(current)}
          </p>
        )}

        {/* Milestone progress dots */}
        <div className="flex items-center gap-2">
          {STREAK_MILESTONES.map((m) => (
            <div key={m} className="flex flex-col items-center gap-1">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
                  current >= m
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "bg-muted border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {current >= m ? "✓" : ""}
              </div>
              <span className="text-xs text-muted-foreground">{m}d</span>
            </div>
          ))}
          {nextMilestone && (
            <span className="text-xs text-muted-foreground ml-1">
              {nextMilestone - current} to next
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
