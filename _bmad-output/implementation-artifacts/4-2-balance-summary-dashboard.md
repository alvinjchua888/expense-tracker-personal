# Story 4.2: Balance Summary Dashboard

**Status:** ready-for-dev  
**Epic:** 4 - Expense Splitting  
**Story Points:** 5  
**Priority:** Medium (Depends on Story 4.1)

**Dependencies:** Story 4.1 (Split Expense with Contacts) must be completed first

---

## Story

**As a** user,  
**I want to** see a summary of who owes me and who I owe,  
**So that** I can settle up with friends.

---

## Acceptance Criteria

### AC1: Splits Navigation Tab
```gherkin
Given I am logged in
When I view the main navigation
Then I see a "Splits" tab/link in the sidebar
And clicking it takes me to the Splits page
```

### AC2: Net Balance per Contact
```gherkin
Given I have split expenses with contacts
When I view the Splits page
Then I see a summary card for each contact showing:
  - Contact name and email
  - Net balance (positive = they owe me, negative = I owe them)
  - Net balance is formatted with currency and color:
    - Green with "owes you" for positive
    - Red with "you owe" for negative
    - Gray with "settled" for zero
```

### AC3: Unsettled Splits List
```gherkin
Given I click on a contact's balance card
When the detail view opens
Then I see a list of all unsettled splits with that contact:
  - Expense description and date
  - Amount they owe or I owe
  - Link to original expense
  - Individual split status
```

### AC4: Settle Up Action
```gherkin
Given I have a positive balance with a contact (they owe me)
When I click "Settle Up"
Then I see a dialog to record the settlement:
  - Amount to settle (defaults to full balance)
  - Optional note
  - Date (defaults to today)
When I confirm
Then all unpaid splits up to that amount are marked as paid
And a settlement record is created
And the balance updates immediately
```

### AC5: Settlement History
```gherkin
Given I have settled up with a contact before
When I view that contact's detail
Then I see a "Settlement History" section showing:
  - Settlement date
  - Amount settled
  - Note (if provided)
  - Number of splits covered
```

### AC6: Filter by Contact
```gherkin
Given I am on the Splits page
When I use the search/filter input
Then the contact list filters to match the search query
And I can quickly find specific contacts
```

### AC7: Summary Statistics
```gherkin
Given I am on the Splits page
When the page loads
Then I see summary statistics at the top:
  - Total owed to me (sum of positive balances)
  - Total I owe (sum of negative balances)
  - Net position (total owed to me - total I owe)
  - Number of contacts with outstanding balances
```

### AC8: Empty State
```gherkin
Given I have no split expenses
When I view the Splits page
Then I see an empty state message:
  - "No splits yet"
  - Brief explanation of the feature
  - Link to create an expense with splits
```

---

## Tasks / Subtasks

### Task 1: Database Schema
- [ ] 1.1 Add `settlements` table to `shared/schema.ts`:
  ```typescript
  export const settlements = pgTable("settlements", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").references(() => users.id).notNull(),
    contactId: integer("contact_id").references(() => contacts.id).notNull(),
    amount: real("amount").notNull(),
    note: text("note"),
    settledAt: timestamp("settled_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  });
  ```
- [ ] 1.2 Add Zod validation schema
- [ ] 1.3 Export types: `Settlement`, `InsertSettlement`
- [ ] 1.4 Run `npm run db:push` to apply migration

### Task 2: Storage Layer
- [ ] 2.1 Add balance calculation methods to `IStorage`:
  ```typescript
  getContactBalances(userId: string): Promise<ContactBalance[]>;
  getContactSplits(userId: string, contactId: number): Promise<ExpenseSplitWithExpense[]>;
  getSettlementHistory(userId: string, contactId: number): Promise<Settlement[]>;
  createSettlement(settlement: InsertSettlement): Promise<Settlement>;
  ```
- [ ] 2.2 Implement balance calculation query:
  ```sql
  SELECT 
    c.id, c.name, c.email,
    SUM(CASE WHEN es.is_paid = false THEN es.amount ELSE 0 END) as amount_owed
  FROM contacts c
  JOIN expense_splits es ON es.contact_id = c.id
  JOIN expenses e ON e.id = es.expense_id
  WHERE c.user_id = $1
  GROUP BY c.id
  ```
- [ ] 2.3 Implement settlement logic (mark splits as paid)

### Task 3: API Routes
- [ ] 3.1 Add balance routes to `server/routes.ts`:
  ```
  GET  /api/splits/balances           - All contact balances
  GET  /api/splits/balances/:contactId - Single contact detail with splits
  GET  /api/splits/settlements/:contactId - Settlement history for contact
  POST /api/splits/settle             - Create settlement and mark splits paid
  ```
- [ ] 3.2 Implement aggregate balance query
- [ ] 3.3 Include summary statistics in balances response

### Task 4: Splits Page
- [ ] 4.1 Create `client/src/pages/Splits.tsx`:
  - Summary statistics cards at top
  - Contact balance cards in grid/list
  - Search/filter input
  - Empty state
- [ ] 4.2 Add route `/splits` to `App.tsx`
- [ ] 4.3 Add "Splits" to sidebar navigation in `AppSidebar.tsx`:
  - Icon: `Split` or `Users` from lucide-react
  - Route: `/splits`

### Task 5: Contact Balance Card Component
- [ ] 5.1 Create `ContactBalanceCard.tsx`:
  - Contact avatar/initials
  - Name and email
  - Balance amount with color coding
  - "Settle Up" button (when positive)
  - Click to view details

### Task 6: Contact Split Detail Sheet
- [ ] 6.1 Create `ContactSplitDetail.tsx` (Sheet or Dialog):
  - Contact header with total balance
  - List of unsettled splits
  - Settlement history section
  - Settle Up button
- [ ] 6.2 Each split item shows:
  - Expense info (merchant, date, description)
  - Split amount
  - Link to expense detail

### Task 7: Settle Up Dialog
- [ ] 7.1 Create `SettleUpDialog.tsx`:
  - Amount input (pre-filled with balance)
  - Optional note input
  - Date picker (defaults to today)
  - Confirm/Cancel buttons
- [ ] 7.2 Handle partial settlements (< full balance)
- [ ] 7.3 Handle over-settlement validation

### Task 8: Summary Statistics Component
- [ ] 8.1 Create `SplitsSummary.tsx`:
  - Card with "Owed to you" amount (green)
  - Card with "You owe" amount (red)
  - Card with "Net position"
  - Responsive grid layout

### Task 9: Testing
- [ ] 9.1 Build passes successfully
- [ ] 9.2 Test balance calculations with multiple splits
- [ ] 9.3 Test settle up flow
- [ ] 9.4 Test partial settlement
- [ ] 9.5 Test filter/search
- [ ] 9.6 Test empty state

---

## Dev Notes

### Balance Calculation Types

```typescript
interface ContactBalance {
  contactId: number;
  contactName: string;
  contactEmail: string | null;
  amountOwed: number; // Positive = they owe user, Negative = user owes them
  splitCount: number;
  lastSplitDate: Date;
}

interface SplitsSummary {
  totalOwedToMe: number;
  totalIOwe: number;
  netPosition: number;
  contactsWithBalance: number;
}
```

### Settlement Logic

```typescript
async function settleUp(
  userId: string,
  contactId: number,
  amount: number,
  note?: string
): Promise<Settlement> {
  // 1. Get all unpaid splits for this contact, oldest first
  const unpaidSplits = await getUnpaidSplits(contactId);
  
  // 2. Mark splits as paid until amount is exhausted
  let remaining = amount;
  for (const split of unpaidSplits) {
    if (remaining >= split.amount) {
      await markSplitPaid(split.id);
      remaining -= split.amount;
    } else {
      break; // Partial settlements don't split individual records
    }
  }
  
  // 3. Create settlement record
  return await createSettlement({
    userId,
    contactId,
    amount,
    note,
  });
}
```

### Existing Patterns to Follow

**Page Layout Pattern** (from Goals.tsx, Budgets.tsx):
```typescript
export default function Splits() {
  const { data: balances, isLoading } = useQuery({
    queryKey: ["/api/splits/balances"],
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Splits</h1>
        <Input placeholder="Search contacts..." />
      </div>
      {/* Summary cards */}
      {/* Balance cards grid */}
    </div>
  );
}
```

**Sheet Pattern** (from existing detail views):
```typescript
<Sheet open={selectedContact !== null} onOpenChange={() => setSelectedContact(null)}>
  <SheetContent className="w-[400px] sm:w-[540px]">
    <SheetHeader>
      <SheetTitle>{selectedContact?.name}</SheetTitle>
    </SheetHeader>
    {/* Detail content */}
  </SheetContent>
</Sheet>
```

### Color Coding

```typescript
const getBalanceColor = (amount: number) => {
  if (amount > 0) return "text-green-600"; // They owe me
  if (amount < 0) return "text-red-600";   // I owe them
  return "text-gray-400";                   // Settled
};

const getBalanceLabel = (amount: number) => {
  if (amount > 0) return "owes you";
  if (amount < 0) return "you owe";
  return "settled";
};
```

### File Locations

| Component | Path |
|-----------|------|
| Schema | `shared/schema.ts` |
| Storage | `server/storage.ts` |
| Routes | `server/routes.ts` |
| Page | `client/src/pages/Splits.tsx` |
| Balance Card | `client/src/components/ContactBalanceCard.tsx` |
| Detail Sheet | `client/src/components/ContactSplitDetail.tsx` |
| Settle Dialog | `client/src/components/SettleUpDialog.tsx` |
| Summary | `client/src/components/SplitsSummary.tsx` |

### Navigation Icon

```typescript
import { Split } from "lucide-react";
// or
import { Users } from "lucide-react";
```

---

## References

- [Source: shared/schema.ts - Existing table patterns]
- [Source: client/src/pages/Budgets.tsx - Page layout pattern]
- [Source: _bmad-output/planning-artifacts/epics.md - Story 4.2 requirements]
- [Dependency: Story 4.1 - Split Expense with Contacts]

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes List
_To be filled during implementation_

### File List
_To be filled with all created/modified files_
