# Story 4.3: Split Settlement Notification

**Status:** ready-for-dev  
**Epic:** 4 - Expense Splitting  
**Story Points:** 3  
**Priority:** Medium (Final story in Epic 4)

**Dependencies:**
- Story 4.1 (Split Expense with Contacts) - Required
- Story 4.2 (Balance Summary Dashboard) - Required

---

## Story

**As a** user,  
**I want to** send a reminder to someone who owes me,  
**So that** I can politely request payment.

---

## Acceptance Criteria

### AC1: Send Reminder Button
```gherkin
Given I have a positive balance with a contact (they owe me)
When I view their balance on the Splits page
Then I see a "Send Reminder" button
And the button is only visible when balance > 0
```

### AC2: Email Notification Content
```gherkin
Given I click "Send Reminder" for a contact
When the email is sent
Then the contact receives an email containing:
  - Subject: "[Your Name] sent you a payment reminder"
  - Total amount owed
  - Itemized list of unpaid expenses (merchant, date, amount)
  - Your name as the sender
  - Friendly, non-aggressive tone
```

### AC3: Track Reminder Timestamp
```gherkin
Given I send a reminder to a contact
When the reminder is sent successfully
Then the system records the reminder_sent_at timestamp
And I see "Reminder sent [date]" indicator on the contact card
```

### AC4: Rate Limiting
```gherkin
Given I sent a reminder to a contact less than 24 hours ago
When I try to send another reminder
Then the "Send Reminder" button is disabled
And I see tooltip "Reminder already sent today. Try again tomorrow."
```

### AC5: Friendly Email Template
```gherkin
Given a reminder email is being composed
Then the email uses a friendly, non-aggressive template:
  - "Hey [Name]," greeting
  - Positive language ("friendly reminder")
  - No urgency or threatening tone
  - Option to reply or discuss
```

### AC6: Payment Link Option
```gherkin
Given a contact has a payment_link stored (Venmo/PayPal)
When I send a reminder
Then the email includes a "Pay Now" button/link
And the link opens the contact's payment service
```

### AC7: Confirmation and Feedback
```gherkin
Given I click "Send Reminder"
When a confirmation dialog appears
Then I see preview of what will be sent
And I can add a personal note (optional)
When I confirm
Then the email is sent
And I see a success toast "Reminder sent to [email]"
```

### AC8: No Email Address Handling
```gherkin
Given a contact has no email address
When I view their balance
Then the "Send Reminder" button is disabled
And I see tooltip "Add email to send reminders"
```

---

## Tasks / Subtasks

### Task 1: Database Schema Update
- [ ] 1.1 Add `reminder_sent_at` to contacts table:
  ```typescript
  // In contacts table definition, add:
  reminderSentAt: timestamp("reminder_sent_at"),
  ```
- [ ] 1.2 Or create separate `reminder_logs` table for history:
  ```typescript
  export const reminderLogs = pgTable("reminder_logs", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").references(() => users.id).notNull(),
    contactId: integer("contact_id").references(() => contacts.id).notNull(),
    sentAt: timestamp("sent_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    personalNote: text("personal_note"),
  });
  ```
- [ ] 1.3 Run `npm run db:push` to apply migration

### Task 2: Email Template
- [ ] 2.1 Create reminder email template in `server/email-templates/`:
  ```typescript
  interface ReminderEmailData {
    senderName: string;
    recipientName: string;
    totalOwed: number;
    currency: string;
    splits: {
      merchant: string;
      date: string;
      amount: number;
    }[];
    paymentLink?: string;
    personalNote?: string;
  }
  ```
- [ ] 2.2 Design HTML email template (responsive)
- [ ] 2.3 Plain text fallback version

### Task 3: Email Service Integration
- [ ] 3.1 Add reminder sending to email service (reuse digest email infrastructure):
  ```typescript
  async sendReminderEmail(
    to: string,
    data: ReminderEmailData
  ): Promise<boolean>
  ```
- [ ] 3.2 Handle email sending errors gracefully
- [ ] 3.3 Add logging for sent reminders

### Task 4: Storage Layer
- [ ] 4.1 Add methods to `IStorage`:
  ```typescript
  getLastReminderSent(userId: string, contactId: number): Promise<Date | null>;
  canSendReminder(userId: string, contactId: number): Promise<boolean>;
  recordReminderSent(userId: string, contactId: number, note?: string): Promise<void>;
  ```
- [ ] 4.2 Implement 24-hour rate limit check

### Task 5: API Routes
- [ ] 5.1 Add reminder routes:
  ```
  POST /api/splits/remind/:contactId - Send reminder email
  GET  /api/splits/remind/:contactId/status - Check if can send
  ```
- [ ] 5.2 Validate contact has email
- [ ] 5.3 Validate positive balance
- [ ] 5.4 Enforce 24-hour rate limit
- [ ] 5.5 Return preview data for confirmation

### Task 6: Send Reminder Dialog
- [ ] 6.1 Create `SendReminderDialog.tsx`:
  - Preview of email content
  - Personal note input (optional)
  - Contact's email display
  - Send/Cancel buttons
  - Payment link preview if available
- [ ] 6.2 Loading state during send
- [ ] 6.3 Success/error handling

### Task 7: UI Integration
- [ ] 7.1 Add "Send Reminder" button to `ContactBalanceCard.tsx`:
  - Show only when balance > 0
  - Disable when recently sent (< 24h)
  - Disable when no email
  - Show tooltip for disabled states
- [ ] 7.2 Add "Send Reminder" button to `ContactSplitDetail.tsx`
- [ ] 7.3 Add "Reminder sent" indicator with timestamp

### Task 8: Contact Payment Link
- [ ] 8.1 Add payment link field to contact edit form
- [ ] 8.2 Support common payment links:
  - Venmo: `venmo://paycharge?txn=pay&...`
  - PayPal: `https://paypal.me/...`
  - CashApp: `https://cash.app/$...`
- [ ] 8.3 Validate URL format

### Task 9: Testing
- [ ] 9.1 Build passes successfully
- [ ] 9.2 Test email template rendering
- [ ] 9.3 Test rate limiting (24-hour rule)
- [ ] 9.4 Test disabled states (no email, recently sent, zero balance)
- [ ] 9.5 Test payment link inclusion
- [ ] 9.6 Test error handling for email failures

---

## Dev Notes

### Email Template Design

```html
<!-- Reminder Email Template -->
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1f2937;">Hey {{recipientName}}! 👋</h2>
  
  <p style="color: #4b5563; line-height: 1.6;">
    Just a friendly reminder from <strong>{{senderName}}</strong> about some shared expenses.
  </p>
  
  <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0; font-size: 14px; color: #6b7280;">Total Amount</p>
    <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: #1f2937;">
      {{currencySymbol}}{{totalOwed}}
    </p>
  </div>
  
  <h3 style="color: #1f2937; font-size: 16px;">Expense Breakdown:</h3>
  <table style="width: 100%; border-collapse: collapse;">
    {{#each splits}}
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 0;">
        <strong>{{merchant}}</strong>
        <br><span style="color: #6b7280; font-size: 14px;">{{date}}</span>
      </td>
      <td style="padding: 12px 0; text-align: right; font-weight: 500;">
        {{currencySymbol}}{{amount}}
      </td>
    </tr>
    {{/each}}
  </table>
  
  {{#if personalNote}}
  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
    <p style="margin: 0; color: #92400e;">{{personalNote}}</p>
  </div>
  {{/if}}
  
  {{#if paymentLink}}
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{paymentLink}}" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
      Pay Now
    </a>
  </div>
  {{/if}}
  
  <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
    Questions? Just reply to this email to chat with {{senderName}}.
  </p>
</div>
```

### Rate Limiting Logic

```typescript
const REMINDER_COOLDOWN_HOURS = 24;

async function canSendReminder(userId: string, contactId: number): Promise<{
  allowed: boolean;
  reason?: string;
  nextAllowedAt?: Date;
}> {
  const contact = await getContact(contactId, userId);
  
  if (!contact) {
    return { allowed: false, reason: "Contact not found" };
  }
  
  if (!contact.email) {
    return { allowed: false, reason: "No email address" };
  }
  
  const balance = await getContactBalance(userId, contactId);
  if (balance <= 0) {
    return { allowed: false, reason: "No outstanding balance" };
  }
  
  const lastReminder = await getLastReminderSent(userId, contactId);
  if (lastReminder) {
    const hoursSince = (Date.now() - lastReminder.getTime()) / (1000 * 60 * 60);
    if (hoursSince < REMINDER_COOLDOWN_HOURS) {
      const nextAllowed = new Date(lastReminder.getTime() + REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000);
      return { 
        allowed: false, 
        reason: "Reminder sent recently",
        nextAllowedAt: nextAllowed 
      };
    }
  }
  
  return { allowed: true };
}
```

### Payment Link Validation

```typescript
const PAYMENT_LINK_PATTERNS = [
  { name: "Venmo", pattern: /^(venmo:\/\/|https?:\/\/(www\.)?venmo\.com)/ },
  { name: "PayPal", pattern: /^https?:\/\/(www\.)?paypal\.(me|com)/ },
  { name: "CashApp", pattern: /^https?:\/\/(www\.)?cash\.app/ },
  { name: "Zelle", pattern: /^https?:\/\/(www\.)?zellepay\.com/ },
];

function validatePaymentLink(url: string): boolean {
  return PAYMENT_LINK_PATTERNS.some(p => p.pattern.test(url));
}
```

### Existing Patterns to Follow

**Email Service** (from digest system):
```typescript
// Reuse existing email infrastructure from server/email-service.ts or similar
import { sendEmail } from "./email-service";

await sendEmail({
  to: contact.email,
  subject: `${userName} sent you a payment reminder`,
  html: renderReminderTemplate(data),
  text: renderReminderTextTemplate(data),
});
```

**Dialog Pattern:**
```typescript
<Dialog open={showReminder} onOpenChange={setShowReminder}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Send Payment Reminder</DialogTitle>
      <DialogDescription>
        Preview the reminder that will be sent to {contact.name}
      </DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowReminder(false)}>Cancel</Button>
      <Button onClick={handleSend} disabled={sending}>
        {sending ? "Sending..." : "Send Reminder"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### File Locations

| Component | Path |
|-----------|------|
| Schema | `shared/schema.ts` |
| Email Template | `server/email-templates/reminder.ts` |
| Storage | `server/storage.ts` |
| Routes | `server/routes.ts` |
| Dialog | `client/src/components/SendReminderDialog.tsx` |

### Environment Variables

May need to configure email service:
```
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=noreply@receipt-tracker.app
```

---

## References

- [Source: server/routes.ts - Existing email/digest patterns]
- [Source: _bmad-output/planning-artifacts/epics.md - Story 4.3 requirements]
- [Dependency: Story 4.1 - contacts and expense_splits tables]
- [Dependency: Story 4.2 - balance calculation and Splits page]

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes List
_To be filled during implementation_

### File List
_To be filled with all created/modified files_
