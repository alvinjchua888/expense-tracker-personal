import type { Budget, Category, Expense, CategoryScoreBreakdown } from "@shared/schema";

export interface BudgetScoreResult {
  totalScore: number;
  breakdown: CategoryScoreBreakdown[];
  descriptor: string;
  descriptorEmoji: string;
}

const SCORE_DESCRIPTORS = [
  { min: 90, label: "Excellent! You're crushing it!", emoji: "🌟" },
  { min: 70, label: "Good job! Keep it up!", emoji: "👍" },
  { min: 50, label: "Fair - Room for improvement", emoji: "📊" },
  { min: 0, label: "Needs Work - Let's tighten the budget", emoji: "💪" },
];

function getDescriptor(score: number): { label: string; emoji: string } {
  for (const d of SCORE_DESCRIPTORS) {
    if (score >= d.min) return { label: d.label, emoji: d.emoji };
  }
  return SCORE_DESCRIPTORS[SCORE_DESCRIPTORS.length - 1];
}

/**
 * Calculate individual category score based on budget adherence
 * Score = percentage of budget remaining, capped at 100
 * Bonus 5 points for significant under-spend (< 50% used)
 */
function calculateCategoryScore(budget: number, spent: number): number {
  if (budget <= 0) return 0;
  
  const percentRemaining = ((budget - spent) / budget) * 100;
  
  // Base score: how much budget remains (can be negative if overspent)
  let score = Math.min(100, Math.max(0, percentRemaining));
  
  // Bonus for significant under-spend (< 50% used)
  if (spent < budget * 0.5 && spent >= 0) {
    score = Math.min(100, score + 5);
  }
  
  return Math.round(score);
}

/**
 * Calculate weighted average of all category scores
 * Weight is based on each category's budget amount
 */
function calculateWeightedAverage(categoryScores: CategoryScoreBreakdown[]): number {
  const totalBudget = categoryScores.reduce((sum, c) => sum + c.budget, 0);
  
  if (totalBudget === 0) return 0;
  
  const weightedSum = categoryScores.reduce(
    (sum, c) => sum + (c.score * c.weight),
    0
  );
  
  return Math.round(weightedSum);
}

/**
 * Calculate budget score for a user based on their budgets and expenses
 * @param budgets - User's budget definitions
 * @param expenses - Expenses for the period being scored
 * @param categories - All user categories (for names and icons)
 */
export function calculateBudgetScore(
  budgets: Budget[],
  expenses: Expense[],
  categories: Category[]
): BudgetScoreResult {
  if (budgets.length === 0) {
    return {
      totalScore: 0,
      breakdown: [],
      descriptor: "Set up budgets to see your score",
      descriptorEmoji: "📝",
    };
  }

  const categoryMap = new Map(categories.map(c => [c.id, c]));
  
  // Calculate spending per category
  const spendingByCategory = new Map<number, number>();
  for (const expense of expenses) {
    if (expense.categoryId) {
      const current = spendingByCategory.get(expense.categoryId) || 0;
      spendingByCategory.set(expense.categoryId, current + expense.amount);
    }
  }

  // Calculate total budget for weight calculations
  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);

  // Build breakdown for each budgeted category
  const breakdown: CategoryScoreBreakdown[] = budgets.map(budget => {
    const category = categoryMap.get(budget.categoryId);
    const spent = spendingByCategory.get(budget.categoryId) || 0;
    const score = calculateCategoryScore(budget.monthlyLimit, spent);
    const weight = totalBudget > 0 ? budget.monthlyLimit / totalBudget : 0;

    return {
      categoryId: budget.categoryId,
      categoryName: category?.name || "Unknown",
      categoryIcon: category?.icon || "MoreHorizontal",
      budget: budget.monthlyLimit,
      spent,
      score,
      weight,
    };
  });

  const totalScore = calculateWeightedAverage(breakdown);
  const { label, emoji } = getDescriptor(totalScore);

  return {
    totalScore,
    breakdown,
    descriptor: label,
    descriptorEmoji: emoji,
  };
}

/**
 * Get the color for a score value
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return "#10B981"; // green (Excellent)
  if (score >= 70) return "#3B82F6"; // blue (Good)
  if (score >= 50) return "#F59E0B"; // amber (Fair)
  return "#EF4444"; // red (Needs Work)
}

/**
 * Get the color class for Tailwind
 */
export function getScoreColorClass(score: number): string {
  if (score >= 90) return "text-green-500";
  if (score >= 70) return "text-blue-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}
