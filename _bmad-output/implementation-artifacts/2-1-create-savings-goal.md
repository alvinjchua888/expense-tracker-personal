# Story 2.1: Create Savings Goal

**Status:** review  
**Epic:** 2 - Savings Goals Tracker  
**Story Points:** 5  
**Priority:** High (Sprint 1)

---

## Story

**As a** user,  
**I want to** create a savings goal with name, target amount, and deadline,  
**So that** I can visualize progress toward financial objectives.

---

## Acceptance Criteria

### AC1: Goal Creation Form
```gherkin
Given I am logged in and on the Goals page
When I click the "Create Goal" button
Then I see a dialog with fields for:
  - Name (required, text, max 100 chars)
  - Target Amount (required, positive number, max 999999999)
  - Target Date (required, date picker, must be future date)
  - Icon/Emoji (optional, dropdown with preset options)
  - Color (optional, color picker with presets)
  - Linked Category (optional, dropdown of user's categories)
```

### AC2: Goal Validation
```gherkin
Given I am filling the goal creation form
When I submit with invalid data:
  - Empty name → "Name is required"
  - Target amount <= 0 → "Target must be positive"
  - Target amount > 999999999 → "Amount too large"
  - Target date in past → "Target date must be in the future"
Then I see appropriate validation error messages
And the form is not submitted
```

### AC3: Goal Persistence
```gherkin
Given I have filled valid goal data
When I click "Save Goal"
Then the goal is saved to the database
And I see a success toast "Goal created successfully"
And the dialog closes
And the new goal appears in my goals list
```

### AC4: Multiple Goals Support
```gherkin
Given I already have goals created
When I create a new goal
Then it is added to my list (up to 10 goals max)
And if I have 10 goals, the create button is disabled with tooltip "Maximum 10 goals reached"
```

### AC5: Goal List Display
```gherkin
Given I have created one or more goals
When I navigate to the Goals page
Then I see all my goals as cards showing:
  - Goal name and icon
  - Target amount formatted with currency symbol
  - Target date
  - Current progress (starts at 0%)
```

### AC6: Edit Goal
```gherkin
Given I have an existing goal
When I click the edit button on a goal card
Then I see the edit dialog pre-filled with current values
And I can modify any field
And saving updates the goal
```

### AC7: Delete Goal
```gherkin
Given I have an existing goal
When I click delete on a goal card
Then I see a confirmation dialog "Delete this goal? This cannot be undone."
When I confirm deletion
Then the goal is removed from database and UI
And I see toast "Goal deleted"
```

---

## Tasks / Subtasks

### Task 1: Database Schema (AC: 3, 4)
- [x] 1.1 Add `savings_goals` table to `shared/schema.ts`
  ```typescript
  // Add after digestPreferences table
  export const savingsGoals = pgTable("savings_goals", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").references(() => users.id).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    targetAmount: real("target_amount").notNull(),
    currentAmount: real("current_amount").default(0).notNull(),
    targetDate: timestamp("target_date").notNull(),
    icon: varchar("icon", { length: 50 }).default("🎯"),
    color: varchar("color", { length: 7 }).default("#3B82F6"),
    linkedCategoryId: integer("linked_category_id").references(() => categories.id),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  });
  ```
- [x] 1.2 Add Zod validation schema `insertSavingsGoalSchema`
- [x] 1.3 Export types: `SavingsGoal`, `InsertSavingsGoal`
- [x] 1.4 Run `npm run db:push` to apply migration (requires DATABASE_URL)

### Task 2: Storage Layer (AC: 3, 4, 6, 7)
- [x] 2.1 Add interface methods to `IStorage` in `server/storage.ts`:
  ```typescript
  getSavingsGoals(userId: string): Promise<SavingsGoal[]>;
  getSavingsGoal(id: number, userId: string): Promise<SavingsGoal | undefined>;
  createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal>;
  updateSavingsGoal(id: number, userId: string, data: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined>;
  deleteSavingsGoal(id: number, userId: string): Promise<void>;
  countSavingsGoals(userId: string): Promise<number>;
  ```
- [x] 2.2 Implement methods in `DatabaseStorage` class

### Task 3: API Routes (AC: 1, 2, 3, 4, 6, 7)
- [x] 3.1 Add routes to `server/routes.ts`:
  ```
  GET    /api/goals          - List all user's goals
  GET    /api/goals/:id      - Get single goal
  POST   /api/goals          - Create goal (validate max 10)
  PUT    /api/goals/:id      - Update goal
  DELETE /api/goals/:id      - Delete goal
  ```
- [x] 3.2 Import `insertSavingsGoalSchema` and `savingsGoals` from schema
- [x] 3.3 Add 10-goal limit check on POST

### Task 4: Goals Page Component (AC: 1, 5)
- [x] 4.1 Create `client/src/pages/Goals.tsx`
  - Follow pattern from `Budgets.tsx`
  - Use TanStack Query for data fetching
  - Display goals as cards in responsive grid
- [x] 4.2 Add Goals to sidebar navigation in `AppSidebar.tsx`
  - Icon: `Flag` from lucide-react
  - Route: `/goals`
- [x] 4.3 Add route to `App.tsx`: `<Route path="/goals" component={Goals} />`

### Task 5: Goal Form Dialog (AC: 1, 2)
- [x] 5.1 Create goal form dialog component within Goals.tsx
  - Use existing Dialog, Input, Label, Select patterns
  - Add DatePicker for target date (use existing date picker or simple input type="date")
  - Add emoji/icon selector (simple select with common icons)
  - Add color picker (preset color buttons)
  - Add optional category dropdown
- [x] 5.2 Implement form validation with error messages
- [x] 5.3 Handle both create and edit modes

### Task 6: Goal Card Component (AC: 5, 6, 7)
- [x] 6.1 Create GoalCard component (can be inline in Goals.tsx)
  - Display name, target, date, progress
  - Edit/Delete action buttons
  - Progress bar showing currentAmount/targetAmount
- [x] 6.2 Add delete confirmation AlertDialog
- [x] 6.3 Add loading skeletons

### Task 7: Testing (All ACs)
- [x] 7.1 Build passes successfully
- [ ] 7.2 Test validation errors display correctly (manual testing needed)
- [ ] 7.3 Test 10-goal limit enforcement (manual testing needed)
- [ ] 7.4 Verify UI updates after create/edit/delete (manual testing needed)

---

## Dev Notes

### Existing Patterns to Follow

**Schema Pattern** (from `shared/schema.ts`):
```typescript
// Follow budgets table pattern:
export const savingsGoals = pgTable("savings_goals", { ... });
export const insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({
  id: true,
  createdAt: true,
  currentAmount: true, // Server manages this
}).extend({
  targetAmount: z.number().positive("Target must be positive").finite().max(999999999),
  name: z.string().min(1, "Name is required").max(100).transform(s => s.trim()),
  targetDate: z.coerce.date().refine(d => d > new Date(), "Target date must be in the future"),
});
```

**Route Pattern** (from budget routes lines 620-686):
```typescript
app.get("/api/goals", isAuthenticated, async (req: any, res: Response) => {
  const userId = req.user.claims.sub;
  const goals = await storage.getSavingsGoals(userId);
  res.json(goals);
});
```

**Page Pattern** (from `Budgets.tsx`):
- useState for dialog state, editing state, deleting state
- useQuery for fetching data
- useMutation for create/update/delete
- queryClient.invalidateQueries on success
- useToast for notifications

**Storage Pattern** (from `storage.ts` lines 436-455):
```typescript
async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  return db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId));
}
```

### File Locations
| Component | Path |
|-----------|------|
| Schema | `shared/schema.ts` (add after line 191) |
| Storage | `server/storage.ts` (add after budget methods ~line 455) |
| Routes | `server/routes.ts` (add after budget routes ~line 686) |
| Page | `client/src/pages/Goals.tsx` (new file) |
| Sidebar | `client/src/components/AppSidebar.tsx` (add nav item) |
| App Router | `client/src/App.tsx` (add route) |

### Icon Options for Goal Selector
```typescript
const GOAL_ICONS = ["🎯", "💰", "🏠", "✈️", "🚗", "📱", "💍", "🎓", "🏥", "🎁"];
```

### Color Presets
```typescript
const GOAL_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green  
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
];
```

### Currency Handling
- Use `useCurrency` hook from `@/hooks/useCurrency` for formatting
- Target amount stored in user's default currency

### Project Structure Notes
- All page components in `client/src/pages/`
- UI primitives from `@/components/ui/`
- Shared types exported from `@shared/schema`
- API calls use `apiRequest` from `@/lib/queryClient`

---

## References

- [Source: shared/schema.ts - Budget table pattern lines 113-127]
- [Source: server/routes.ts - Budget routes lines 620-686]
- [Source: server/storage.ts - Budget storage methods lines 436-455]
- [Source: client/src/pages/Budgets.tsx - Page component pattern]
- [Source: _bmad-output/planning-artifacts/epics.md - Story 2.1 requirements]

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes List
_To be filled during implementation_

### File List
_To be filled with all created/modified files_
