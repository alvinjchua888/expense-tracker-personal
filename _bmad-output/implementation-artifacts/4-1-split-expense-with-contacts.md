# Story 4.1: Split Expense with Contacts

**Status:** ready-for-dev  
**Epic:** 4 - Expense Splitting  
**Story Points:** 5  
**Priority:** Medium (Foundation for Epic 4)

---

## Story

**As a** user,  
**I want to** split an expense with one or more contacts,  
**So that** I can track who owes me money.

---

## Acceptance Criteria

### AC1: Split Toggle on Expense Form
```gherkin
Given I am creating or editing an expense
When I toggle "Split this expense" ON
Then I see additional fields to add split participants
And the split section expands below the main expense fields
```

### AC2: Add Contacts by Email or Name
```gherkin
Given I am adding a split participant
When I enter an email or name
Then the system searches my existing contacts
And suggests matching contacts in a dropdown
And allows creating a new contact if no match
```

### AC3: Pending Contact Creation
```gherkin
Given I enter an email for someone not yet a registered user
When I save the split
Then a pending contact is created with that email
And the split is saved linked to the pending contact
And the contact appears in my contacts list
```

### AC4: Equal vs Custom Split
```gherkin
Given I have added 2+ participants to a split
When I view the split amounts
Then by default, amounts are split equally (including myself)
And I can toggle to "Custom" split mode
And in custom mode, I can enter specific amounts per person
And the system validates that split amounts equal the expense total
```

### AC5: Split Details Saved
```gherkin
Given I save an expense with splits
When the expense is saved
Then split records are created for each participant
And each record includes: contact info, amount owed, isPaid status
And the expense shows a "Split" indicator in the list
```

### AC6: View Split Breakdown
```gherkin
Given I view an expense that has splits
When I open the expense detail
Then I see the split breakdown:
  - Each participant's name/email
  - Amount they owe
  - Paid/Unpaid status
  - Date added
```

### AC7: Edit Splits After Creation
```gherkin
Given I have an expense with existing splits
When I edit the expense
Then I can modify, add, or remove split participants
And changing the expense amount recalculates equal splits
And I see a warning if changing amounts on already-paid splits
```

### AC8: Split Validation
```gherkin
Given I am creating a split expense
When the sum of split amounts doesn't equal the expense total
Then I see validation error "Split amounts must equal total expense"
And the form cannot be submitted
```

---

## Tasks / Subtasks

### Task 1: Database Schema
- [ ] 1.1 Add `contacts` table to `shared/schema.ts`:
  ```typescript
  export const contacts = pgTable("contacts", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").references(() => users.id).notNull(),
    email: varchar("email", { length: 255 }),
    name: varchar("name", { length: 100 }).notNull(),
    paymentLink: varchar("payment_link", { length: 500 }), // Venmo/PayPal link
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  }, (table) => [
    unique("contacts_user_email_unique").on(table.userId, table.email)
  ]);
  ```
- [ ] 1.2 Add `expense_splits` table:
  ```typescript
  export const expenseSplits = pgTable("expense_splits", {
    id: serial("id").primaryKey(),
    expenseId: integer("expense_id").references(() => expenses.id, { onDelete: "cascade" }).notNull(),
    contactId: integer("contact_id").references(() => contacts.id).notNull(),
    amount: real("amount").notNull(),
    isPaid: boolean("is_paid").default(false).notNull(),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  });
  ```
- [ ] 1.3 Add Zod validation schemas for both tables
- [ ] 1.4 Export types
- [ ] 1.5 Run `npm run db:push` to apply migration

### Task 2: Storage Layer - Contacts
- [ ] 2.1 Add contact interface methods to `IStorage`:
  ```typescript
  getContacts(userId: string): Promise<Contact[]>;
  getContact(id: number, userId: string): Promise<Contact | undefined>;
  searchContacts(userId: string, query: string): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, userId: string, data: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number, userId: string): Promise<void>;
  ```
- [ ] 2.2 Implement methods in `DatabaseStorage`

### Task 3: Storage Layer - Expense Splits
- [ ] 3.1 Add expense split interface methods:
  ```typescript
  getExpenseSplits(expenseId: number): Promise<ExpenseSplitWithContact[]>;
  createExpenseSplits(expenseId: number, splits: InsertExpenseSplit[]): Promise<ExpenseSplit[]>;
  updateExpenseSplit(id: number, data: Partial<InsertExpenseSplit>): Promise<ExpenseSplit | undefined>;
  deleteExpenseSplits(expenseId: number): Promise<void>;
  markSplitPaid(id: number): Promise<ExpenseSplit | undefined>;
  ```
- [ ] 3.2 Implement methods with contact join

### Task 4: API Routes - Contacts
- [ ] 4.1 Add contact routes to `server/routes.ts`:
  ```
  GET    /api/contacts          - List all contacts
  GET    /api/contacts/search   - Search contacts by name/email
  POST   /api/contacts          - Create contact
  PUT    /api/contacts/:id      - Update contact
  DELETE /api/contacts/:id      - Delete contact
  ```

### Task 5: API Routes - Splits
- [ ] 5.1 Modify expense create/update routes to handle splits:
  ```
  POST /api/expenses (with optional splits array)
  PUT  /api/expenses/:id (with optional splits array)
  ```
- [ ] 5.2 Add split-specific routes:
  ```
  GET  /api/expenses/:id/splits     - Get splits for expense
  POST /api/splits/:id/mark-paid    - Mark split as paid
  ```
- [ ] 5.3 Add validation for split total = expense total

### Task 6: Expense Form Enhancement
- [ ] 6.1 Add "Split this expense" toggle to `ExpenseForm.tsx`
- [ ] 6.2 Create `SplitSection` component:
  - Contact search/add input
  - List of added participants
  - Equal/Custom toggle
  - Amount inputs for custom mode
- [ ] 6.3 Add validation for split totals
- [ ] 6.4 Handle form state for splits

### Task 7: Contact Search Component
- [ ] 7.1 Create `ContactSearch.tsx` with autocomplete:
  - Debounced search input
  - Dropdown with matching contacts
  - "Create new contact" option
  - Show email and name
- [ ] 7.2 Create inline contact creation dialog

### Task 8: Split Display Components
- [ ] 8.1 Add split indicator to expense list items
- [ ] 8.2 Create `SplitBreakdown` component for expense detail:
  - Participant list with amounts
  - Paid/Unpaid badges
  - "Mark as paid" button
- [ ] 8.3 Add split info to expense detail dialog

### Task 9: Testing
- [ ] 9.1 Build passes successfully
- [ ] 9.2 Test equal split calculation
- [ ] 9.3 Test custom split validation
- [ ] 9.4 Test contact search and creation
- [ ] 9.5 Test edit splits on existing expense
- [ ] 9.6 Test expense deletion cascades to splits

---

## Dev Notes

### Split Calculation

```typescript
function calculateEqualSplit(total: number, participants: number): number {
  // participants includes the current user
  return Math.round((total / participants) * 100) / 100;
}

// Handle rounding - give remainder to first participant
function distributeEqualSplit(total: number, participants: number): number[] {
  const baseAmount = Math.floor((total / participants) * 100) / 100;
  const amounts = Array(participants).fill(baseAmount);
  
  const remainder = total - (baseAmount * participants);
  amounts[0] = Math.round((amounts[0] + remainder) * 100) / 100;
  
  return amounts;
}
```

### Form State Shape

```typescript
interface SplitFormState {
  enabled: boolean;
  mode: "equal" | "custom";
  participants: {
    contactId?: number;
    name: string;
    email?: string;
    amount: number;
    isNew: boolean;
  }[];
}
```

### Existing Patterns to Follow

**Contact Search Pattern:**
- Similar to category selector in ExpenseForm
- Use Combobox from shadcn/ui

**API Request Pattern:**
```typescript
// Extend expense creation to include splits
const response = await apiRequest("POST", "/api/expenses", {
  ...expenseData,
  splits: splitData, // Optional array
});
```

**Schema Pattern:**
```typescript
export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Name is required").max(100).transform(s => s.trim()),
  email: z.string().email().nullable().optional(),
  paymentLink: z.string().url().nullable().optional(),
});
```

### File Locations

| Component | Path |
|-----------|------|
| Schema | `shared/schema.ts` |
| Storage | `server/storage.ts` |
| Routes | `server/routes.ts` |
| Split Section | `client/src/components/SplitSection.tsx` |
| Contact Search | `client/src/components/ContactSearch.tsx` |
| Split Breakdown | `client/src/components/SplitBreakdown.tsx` |

### UI Considerations

- Split toggle should be subtle - not overwhelming for users who don't need it
- Contact autocomplete should be fast (debounce 300ms)
- Show running total of splits vs expense amount in real-time
- Use badges for paid/unpaid status (green/gray)

---

## References

- [Source: shared/schema.ts - Existing table patterns]
- [Source: client/src/components/ExpenseForm.tsx - Form patterns]
- [Source: _bmad-output/planning-artifacts/epics.md - Story 4.1 requirements]

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes List
_To be filled during implementation_

### File List
_To be filled with all created/modified files_
