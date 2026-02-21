# Story 5.3: Monthly Budget Score

**Status:** done  
**Epic:** 5 - Achievement Badges & Streaks  
**Story Points:** 5  
**Priority:** High (Completes Epic 5)

---

## Story

**As a** user,  
**I want to** see a monthly "Budget Score" (0-100),  
**So that** I have a gamified view of my budget adherence.

---

## Acceptance Criteria

### AC1: Score Calculation
```gherkin
Given I have budgets set for one or more categories
When I view my Budget Score for the current month
Then the score is calculated as:
  - Each category: min(100, (budget - spent) / budget * 100)
  - Final score: weighted average by budget amount
  - Bonus points for categories significantly under budget (< 50% spent)
  - Score clamped to 0-100 range
```

### AC2: Visual Score Display
```gherkin
Given I navigate to the Budget Score section
When the page loads
Then I see a circular gauge displaying my score (0-100)
And the gauge color transitions based on score:
  - 90-100: Green (Excellent)
  - 70-89: Blue (Good)
  - 50-69: Amber (Fair)
  - <50: Red (Needs Work)
And the score descriptor text is displayed below the gauge
```

### AC3: Score Breakdown
```gherkin
Given I view my Budget Score
When I see the breakdown section
Then I see each category's contribution showing:
  - Category name and icon
  - Budget amount vs spent amount
  - Individual category score (0-100)
  - Weight percentage in final score
```

### AC4: Historical Score Trend
```gherkin
Given I have Budget Scores from previous months
When I view the trend chart
Then I see a line chart showing scores for the last 6 months
And each point shows month/year and score value on hover
And months with no data show as "N/A" or are skipped
```

### AC5: Monthly Score Comparison
```gherkin
Given I am viewing the current month's Budget Score
When the previous month had a score
Then I see a comparison indicator:
  - ↑ or ↓ arrow with percentage change
  - Green for improvement, red for decline
  - "No previous data" if first month
```

### AC6: Score Descriptors
```gherkin
Given my Budget Score is calculated
Then the descriptor text matches:
  - 90-100: "Excellent! You're crushing it! 🌟"
  - 70-89: "Good job! Keep it up! 👍"
  - 50-69: "Fair - Room for improvement 📊"
  - <50: "Needs Work - Let's tighten the budget 💪"
```

### AC7: No Budgets State
```gherkin
Given I have no budgets set
When I view the Budget Score section
Then I see a friendly empty state message:
  - "Set up budgets to see your Budget Score"
  - Link/button to navigate to Budgets page
```

---

## Tasks / Subtasks

### Task 1: Database Schema
- [ ] 1.1 Add `monthly_scores` table to `shared/schema.ts`:
  ```typescript
  export const monthlyScores = pgTable("monthly_scores", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").references(() => users.id).notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(), // 1-12
    score: real("score").notNull(),
    breakdown: jsonb("breakdown").notNull(), // Array of category scores
    calculatedAt: timestamp("calculated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  }, (table) => [
    unique("monthly_scores_user_month_unique").on(table.userId, table.year, table.month)
  ]);
  ```
- [ ] 1.2 Add Zod validation schema
- [ ] 1.3 Export types: `MonthlyScore`, `InsertMonthlyScore`
- [ ] 1.4 Run `npm run db:push` to apply migration

### Task 2: Score Calculation Logic
- [ ] 2.1 Create score calculation utility in `server/budget-score.ts`:
  ```typescript
  interface CategoryScore {
    categoryId: number;
    categoryName: string;
    categoryIcon: string;
    budget: number;
    spent: number;
    score: number;
    weight: number;
  }
  
  interface BudgetScoreResult {
    totalScore: number;
    breakdown: CategoryScore[];
    descriptor: string;
  }
  
  export function calculateBudgetScore(
    budgets: Budget[],
    expenses: Expense[],
    categories: Category[]
  ): BudgetScoreResult
  ```
- [ ] 2.2 Implement weighted average calculation
- [ ] 2.3 Implement bonus points for under-budget categories
- [ ] 2.4 Add score descriptor logic

### Task 3: Storage Layer
- [ ] 3.1 Add interface methods to `IStorage`:
  ```typescript
  getMonthlyScore(userId: string, year: number, month: number): Promise<MonthlyScore | undefined>;
  getMonthlyScoreHistory(userId: string, months: number): Promise<MonthlyScore[]>;
  saveMonthlyScore(score: InsertMonthlyScore): Promise<MonthlyScore>;
  ```
- [ ] 3.2 Implement methods in `DatabaseStorage` class

### Task 4: API Routes
- [ ] 4.1 Add routes to `server/routes.ts`:
  ```
  GET /api/analytics/budget-score              - Current month score (calculate on demand)
  GET /api/analytics/budget-score/history      - Last 6 months history
  GET /api/analytics/budget-score/:year/:month - Specific month score
  ```
- [ ] 4.2 Calculate score on-demand if not cached for current month
- [ ] 4.3 Include comparison with previous month in response

### Task 5: Budget Score Component
- [ ] 5.1 Create `client/src/components/BudgetScore.tsx`:
  - Circular gauge visualization (use CSS or SVG)
  - Color transitions based on score
  - Score number prominently displayed
  - Descriptor text below
- [ ] 5.2 Create `client/src/components/ScoreBreakdown.tsx`:
  - List of categories with individual scores
  - Progress bars showing budget vs spent
  - Weight percentage display

### Task 6: Budget Score Widget for Dashboard
- [ ] 6.1 Create compact `BudgetScoreWidget` for Dashboard
  - Show circular gauge and score
  - Link to full Budget Score page
- [ ] 6.2 Add to Dashboard layout next to StreakWidget

### Task 7: Historical Trend Chart
- [ ] 7.1 Create `ScoreTrendChart` component
  - Use Recharts LineChart (already in project)
  - Last 6 months data
  - Responsive design
- [ ] 7.2 Add month/score tooltips

### Task 8: Budget Score Page
- [ ] 8.1 Create `client/src/pages/BudgetScore.tsx`
  - Full score display with all components
  - Historical trend
  - Category breakdown
- [ ] 8.2 Add route `/budget-score` to App.tsx
- [ ] 8.3 Add navigation link in sidebar (optional - can be under Analytics dropdown)

### Task 9: Testing
- [ ] 9.1 Build passes successfully
- [ ] 9.2 Test score calculation with various budget/expense combinations
- [ ] 9.3 Test empty state (no budgets)
- [ ] 9.4 Test historical data display
- [ ] 9.5 Verify color transitions and descriptors

---

## Dev Notes

### Score Calculation Algorithm

```typescript
function calculateCategoryScore(budget: number, spent: number): number {
  if (budget <= 0) return 0;
  
  const percentRemaining = ((budget - spent) / budget) * 100;
  
  // Base score: how much budget remains
  let score = Math.min(100, Math.max(0, percentRemaining));
  
  // Bonus for significant under-spend (< 50% used)
  if (spent < budget * 0.5) {
    score = Math.min(100, score + 5);
  }
  
  return Math.round(score);
}

function calculateWeightedAverage(
  categoryScores: CategoryScore[]
): number {
  const totalBudget = categoryScores.reduce((sum, c) => sum + c.budget, 0);
  
  if (totalBudget === 0) return 0;
  
  const weightedSum = categoryScores.reduce(
    (sum, c) => sum + (c.score * (c.budget / totalBudget)),
    0
  );
  
  return Math.round(weightedSum);
}
```

### Existing Patterns to Follow

**Circular Gauge Options:**
1. SVG circle with `stroke-dasharray` and `stroke-dashoffset`
2. CSS conic-gradient (modern browsers)
3. Recharts RadialBarChart

**Chart Pattern** (from existing analytics):
```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
```

**Color Constants:**
```typescript
const SCORE_COLORS = {
  excellent: "#10B981", // green
  good: "#3B82F6",      // blue  
  fair: "#F59E0B",      // amber
  needsWork: "#EF4444", // red
};
```

### API Response Shape

```typescript
interface BudgetScoreResponse {
  currentMonth: {
    year: number;
    month: number;
    score: number;
    descriptor: string;
    breakdown: CategoryScore[];
  };
  previousMonth?: {
    score: number;
    change: number; // percentage change
  };
  history: {
    year: number;
    month: number;
    score: number;
  }[];
}
```

### File Locations

| Component | Path |
|-----------|------|
| Schema | `shared/schema.ts` |
| Score Logic | `server/budget-score.ts` (new) |
| Storage | `server/storage.ts` |
| Routes | `server/routes.ts` |
| Gauge Component | `client/src/components/BudgetScore.tsx` |
| Dashboard Widget | `client/src/components/BudgetScoreWidget.tsx` |
| Full Page | `client/src/pages/BudgetScore.tsx` |

---

## References

- [Source: shared/schema.ts - Existing table patterns]
- [Source: client/src/pages/Analytics.tsx - Chart patterns]
- [Source: client/src/components/StreakWidget.tsx - Dashboard widget pattern]
- [Source: _bmad-output/planning-artifacts/epics.md - Story 5.3 requirements]

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes List
_To be filled during implementation_

### File List
_To be filled with all created/modified files_
