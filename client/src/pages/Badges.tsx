import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock } from "lucide-react";
import type { UserBadge } from "@shared/schema";

interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { key: "first_expense",   name: "First Step",      description: "Log your first expense",         icon: "🌱", color: "#10B981" },
  { key: "ten_expenses",    name: "Getting Started",  description: "Log 10 expenses",                icon: "📝", color: "#3B82F6" },
  { key: "fifty_expenses",  name: "Regular Tracker",  description: "Log 50 expenses",                icon: "📊", color: "#6366F1" },
  { key: "receipt_rookie",  name: "Receipt Rookie",   description: "Upload your first receipt",      icon: "🧾", color: "#F59E0B" },
  { key: "scanner_pro",     name: "Scanner Pro",      description: "Upload 10 receipts",             icon: "📸", color: "#EF4444" },
  { key: "week_warrior",    name: "Week Warrior",     description: "Maintain a 7-day streak",        icon: "🔥", color: "#F97316" },
  { key: "month_master",    name: "Month Master",     description: "Maintain a 30-day streak",       icon: "💎", color: "#8B5CF6" },
  { key: "streak_100",      name: "Century Streak",   description: "Maintain a 100-day streak",      icon: "🏆", color: "#EAB308" },
  { key: "streak_365",      name: "Year of Tracking", description: "Maintain a 365-day streak",      icon: "🌟", color: "#EC4899" },
  { key: "goal_setter",     name: "Goal Setter",      description: "Create your first savings goal", icon: "🎯", color: "#14B8A6" },
  { key: "budget_boss",     name: "Budget Boss",      description: "Create your first budget",       icon: "💰", color: "#22C55E" },
];

export default function Badges() {
  const { data: earnedBadges = [], isLoading } = useQuery<UserBadge[]>({
    queryKey: ["/api/badges"],
  });

  const earnedKeys = new Set(earnedBadges.map((b) => b.badgeKey));
  const earnedCount = earnedKeys.size;

  return (
    <div className="space-y-6" data-testid="badges-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Achievements</h1>
          <p className="text-muted-foreground">Earn badges by building good financial habits</p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold text-lg">
            {earnedCount} / {BADGE_DEFINITIONS.length}
          </span>
          <span className="text-muted-foreground text-sm">badges earned</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-700"
          style={{ width: `${(earnedCount / BADGE_DEFINITIONS.length) * 100}%` }}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 11 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {BADGE_DEFINITIONS.map((def) => {
            const earned = earnedKeys.has(def.key);
            const earnedBadge = earnedBadges.find((b) => b.badgeKey === def.key);
            return (
              <Card
                key={def.key}
                className={`relative overflow-hidden transition-all ${
                  earned
                    ? "shadow-md border-2"
                    : "opacity-60 grayscale"
                }`}
                style={earned ? { borderColor: def.color + "60" } : {}}
              >
                {earned && (
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: def.color }}
                  />
                )}
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shrink-0"
                      style={{
                        backgroundColor: earned ? def.color + "20" : undefined,
                        border: `2px solid ${earned ? def.color + "60" : "transparent"}`,
                      }}
                    >
                      {earned ? def.icon : <Lock className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{def.name}</p>
                        {earned && (
                          <Badge
                            className="text-xs px-1.5 py-0 h-4"
                            style={{ backgroundColor: def.color + "20", color: def.color, borderColor: def.color + "40" }}
                            variant="outline"
                          >
                            Earned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{def.description}</p>
                      {earned && earnedBadge && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(earnedBadge.unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && earnedCount === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No badges yet</p>
          <p className="text-sm">Start logging expenses and building streaks to earn achievements!</p>
        </div>
      )}
    </div>
  );
}
