# Receipt-Tracker Enhancement Epics

**Generated from:** Brainstorming Session 2026-02-18  
**Project:** Receipt-Tracker  
**Total Epics:** 5  
**Total Stories:** 15

---

## Epic 1: Conversational Expense Entry

**Goal:** Enable natural language and voice-based expense input to streamline the expense logging experience.

**Value Statement:** Users can quickly log expenses by typing or speaking naturally, reducing friction and increasing adoption.

**Dependencies:** OpenAI GPT-4o (already integrated), Web Speech API

### Story 1.1: Natural Language Expense Parsing

**As a** user  
**I want to** type "Spent $45 at Costco on groceries today"  
**So that** I can quickly log expenses without filling out forms

**Acceptance Criteria:**
- [ ] Parse amount from natural text (handles $, various formats like "45 dollars", "45.99")
- [ ] Extract merchant name from text
- [ ] Detect category keywords and auto-assign to existing categories
- [ ] Parse date expressions ("today", "yesterday", "last Tuesday", "March 5th")
- [ ] Show confirmation preview before saving
- [ ] Handle ambiguous input with clarifying questions
- [ ] Support multi-currency mentions ("50 euros", "1000 yen")

**Technical Notes:**
- Use GPT-4o for NLP parsing (existing integration)
- Create `/api/expenses/parse-natural` endpoint
- Return structured JSON with confidence scores
- Fallback to form if confidence < 70%

**Story Points:** 8

---

### Story 1.2: Voice-to-Expense Entry

**As a** user  
**I want to** speak my expense details using voice input  
**So that** I can log expenses hands-free while driving or cooking

**Acceptance Criteria:**
- [ ] Microphone button on quick-add interface
- [ ] Web Speech API integration for voice capture
- [ ] Visual feedback during voice capture (waveform or pulsing indicator)
- [ ] Transcription passed to NL parser from Story 1.1
- [ ] Works in supported browsers (Chrome, Edge, Safari)
- [ ] Graceful fallback message on unsupported browsers
- [ ] Stop recording on silence detection or manual stop

**Technical Notes:**
- Use Web Speech API (SpeechRecognition)
- Add VoiceInput component wrapping ExpenseForm
- Handle browser compatibility with feature detection

**Story Points:** 5

---

### Story 1.3: Expense Query Chat

**As a** user  
**I want to** ask "How much did I spend on coffee this month?"  
**So that** I can get quick answers without navigating to analytics

**Acceptance Criteria:**
- [ ] Chat interface accessible from dashboard or floating button
- [ ] GPT-powered query understanding with expense context
- [ ] Returns formatted answers with relevant data
- [ ] Supports queries: date ranges, categories, merchants, comparisons
- [ ] Links to relevant analytics pages for deep dives
- [ ] Query history within session
- [ ] Handle "I don't understand" gracefully

**Technical Notes:**
- Create `/api/chat/expense-query` endpoint
- Pass user's expense summary as context to GPT
- Rate limit: 10 queries/minute per user
- Use existing AI rate limiter

**Story Points:** 8

---

## Epic 2: Savings Goals Tracker

**Goal:** Enable users to set, track, and achieve financial savings goals with visual progress indicators.

**Value Statement:** Users gain motivation and clarity about their savings progress, improving financial outcomes.

**Dependencies:** None (new feature)

### Story 2.1: Create Savings Goal

**As a** user  
**I want to** create a savings goal with name, target amount, and deadline  
**So that** I can visualize progress toward financial objectives

**Acceptance Criteria:**
- [ ] Goal creation form with fields: name, target amount, target date, icon/emoji, color
- [ ] Optional: link goal to specific spending category (e.g., "reduce dining to save")
- [ ] Goal stored in database with user association
- [ ] Support for multiple concurrent goals (up to 10)
- [ ] Edit goal functionality
- [ ] Delete goal with confirmation
- [ ] Goal list view in sidebar navigation

**Technical Notes:**
- Create `savings_goals` table in schema
- Fields: id, userId, name, targetAmount, currentAmount, targetDate, icon, color, linkedCategoryId, createdAt
- CRUD endpoints: `/api/goals`

**Story Points:** 5

---

### Story 2.2: Manual Goal Contributions

**As a** user  
**I want to** manually log contributions toward my savings goal  
**So that** I can track progress on goals not tied to spending categories

**Acceptance Criteria:**
- [ ] "Add Contribution" button on goal card
- [ ] Amount field with optional note
- [ ] Contribution history with dates visible on goal detail page
- [ ] Running total calculation updates goal progress
- [ ] Undo/delete recent contribution
- [ ] Contribution validation (positive amounts only)

**Technical Notes:**
- Create `goal_contributions` table
- Fields: id, goalId, amount, note, createdAt
- Endpoint: POST `/api/goals/:id/contributions`

**Story Points:** 3

---

### Story 2.3: Visual Goal Progress

**As a** user  
**I want to** see animated progress bars and milestone celebrations  
**So that** I feel motivated to continue saving

**Acceptance Criteria:**
- [ ] Circular or linear progress visualization (user preference)
- [ ] Display: percentage complete, current amount, remaining amount
- [ ] Milestone markers at 25%, 50%, 75%, 100%
- [ ] Celebration animation when milestone is reached (confetti/sparkle)
- [ ] "Days remaining" countdown
- [ ] Projected completion date based on average contribution rate
- [ ] Color transitions as progress increases

**Technical Notes:**
- Use Framer Motion or CSS animations for celebrations
- Calculate projection: (remaining / avgContributionPerDay) days
- Store milestone_reached flags to avoid repeat celebrations

**Story Points:** 5

---

## Epic 3: PWA with Offline Mode

**Goal:** Transform the web app into an installable Progressive Web App with full offline functionality.

**Value Statement:** Users can access and log expenses anywhere, even without internet, with automatic sync when reconnected.

**Dependencies:** Service Worker, IndexedDB

### Story 3.1: PWA Installation

**As a** user  
**I want to** install the app on my device's home screen  
**So that** it feels like a native mobile app

**Acceptance Criteria:**
- [ ] Valid web manifest with app name, icons (192x192, 512x512), theme colors
- [ ] Service worker registration on app load
- [ ] "Install" prompt appears on supported browsers (Chrome, Edge, Safari iOS)
- [ ] App opens in standalone mode (no browser chrome)
- [ ] Splash screen on launch
- [ ] Works on iOS, Android, and desktop

**Technical Notes:**
- Create `/public/manifest.json`
- Generate icon sizes with sharp or manually
- Service worker with Workbox or vanilla SW
- Add `<link rel="manifest">` to index.html

**Story Points:** 5

---

### Story 3.2: Offline Expense Entry

**As a** user  
**I want to** add expenses when offline  
**So that** I can log purchases immediately regardless of connectivity

**Acceptance Criteria:**
- [ ] IndexedDB storage for offline expense queue
- [ ] Offline detection with visual indicator (banner or icon)
- [ ] Queue indicator showing number of pending syncs
- [ ] Automatic sync when connection is restored
- [ ] Conflict resolution: server wins for edits, client wins for new entries
- [ ] Retry logic for failed syncs (exponential backoff)
- [ ] User notification on successful sync

**Technical Notes:**
- Use `idb` library for IndexedDB wrapper
- Create `offline-queue` store
- Background sync API where supported
- Fallback to polling for sync on reconnect

**Story Points:** 8

---

### Story 3.3: Offline Data Access

**As a** user  
**I want to** view my recent expenses and budgets while offline  
**So that** I can reference my spending without internet

**Acceptance Criteria:**
- [ ] Cache last 100 expenses in IndexedDB on each fetch
- [ ] Cache all user categories and budgets
- [ ] "Offline mode" visual indicator when viewing cached data
- [ ] Stale indicator showing last sync time
- [ ] Background sync for fresh data on reconnect
- [ ] Cache size management (clear old data if > 5MB)

**Technical Notes:**
- Service worker caches API responses
- Stale-while-revalidate strategy for reads
- Store last_synced timestamp

**Story Points:** 8

---

## Epic 4: Expense Splitting

**Goal:** Enable users to split expenses with friends and track shared payment balances.

**Value Statement:** Users can easily manage shared expenses with roommates, partners, or friends without needing a separate app.

**Dependencies:** Email notifications (existing digest system)

### Story 4.1: Split Expense with Contacts

**As a** user  
**I want to** split an expense with one or more contacts  
**So that** I can track who owes me money

**Acceptance Criteria:**
- [ ] "Split" toggle/option on expense entry and edit forms
- [ ] Add contacts by email or name
- [ ] Creates pending contact if email not a registered user
- [ ] Equal split (default) or custom amounts per person
- [ ] Split details saved with expense record
- [ ] View split breakdown on expense detail
- [ ] Edit splits after creation

**Technical Notes:**
- Create `expense_splits` table: id, expenseId, contactEmail, contactName, amount, isPaid, createdAt
- Create `contacts` table: id, userId, email, name, createdAt
- Split total must equal expense amount (validation)

**Story Points:** 5

---

### Story 4.2: Balance Summary Dashboard

**As a** user  
**I want to** see a summary of who owes me and who I owe  
**So that** I can settle up with friends

**Acceptance Criteria:**
- [ ] "Splits" tab in main navigation
- [ ] Net balance per contact (positive = they owe you, negative = you owe them)
- [ ] List of all unsettled splits grouped by contact
- [ ] "Settle Up" action to mark balance as paid
- [ ] Settlement history log
- [ ] Filter by contact

**Technical Notes:**
- Create `/api/splits/balances` endpoint
- Aggregate query: SUM splits by contact, group by direction
- Settlement creates a "settlement" record, marks splits as paid

**Story Points:** 5

---

### Story 4.3: Split Settlement Notification

**As a** user  
**I want to** send a reminder to someone who owes me  
**So that** I can politely request payment

**Acceptance Criteria:**
- [ ] "Send Reminder" button on outstanding balance
- [ ] Email notification includes: total owed, itemized expense list, your name
- [ ] Track reminder_sent_at timestamp
- [ ] Rate limit: max 1 reminder per contact per 24 hours
- [ ] Friendly, non-aggressive email template
- [ ] Option to include payment link (Venmo/PayPal deep link if provided)

**Technical Notes:**
- Reuse digest email infrastructure
- Create reminder email template
- Add payment_link field to contacts (optional)

**Story Points:** 3

---

## Epic 5: Achievement Badges & Streaks

**Goal:** Add gamification elements to increase user engagement and encourage consistent expense tracking habits.

**Value Statement:** Users feel rewarded for good financial behavior, increasing app stickiness and habit formation.

**Dependencies:** None (new feature)

### Story 5.1: Logging Streak Tracker

**As a** user  
**I want to** maintain a "daily logging" streak counter  
**So that** I stay motivated to track expenses consistently

**Acceptance Criteria:**
- [ ] Track consecutive days with at least one expense entry
- [ ] Prominent streak display on dashboard (flame icon with number)
- [ ] "Streak at risk" notification if no expense logged by 8 PM
- [ ] Streak recovery grace period: 1 freeze per week
- [ ] Longest streak record displayed in profile
- [ ] Streak milestones: 7, 30, 100, 365 days

**Technical Notes:**
- Add to users table: current_streak, longest_streak, last_expense_date, streak_freezes_used
- Daily cron job to check and reset streaks at midnight
- Push notification for "streak at risk" (future: web push)

**Story Points:** 5

---

### Story 5.2: Achievement Badge System

**As a** user  
**I want to** earn badges for financial milestones  
**So that** I feel rewarded for good financial behavior

**Acceptance Criteria:**
- [ ] Badge definitions stored in database/config
- [ ] Automatic badge unlock when condition is met
- [ ] Badge collection view in user profile/settings
- [ ] New badge celebration animation (modal with confetti)
- [ ] Badge categories: Tracking, Saving, Budgeting, Milestones
- [ ] At least 15 badges at launch

**Launch Badges:**
1. First Expense - Log your first expense
2. Week Warrior - 7-day logging streak
3. Month Master - 30-day logging streak
4. Budget Boss - Stay under budget for a full month
5. Receipt Rookie - Scan your first receipt
6. Scanner Pro - Scan 50 receipts
7. Category King - Use all categories
8. Goal Getter - Complete a savings goal
9. Split Master - Split 10 expenses
10. Early Bird - Log expense before 9 AM
11. Night Owl - Log expense after 9 PM
12. World Traveler - Use 5 different currencies
13. Penny Pincher - Reduce spending 10% month-over-month
14. Recurring Regular - Set up 5 recurring expenses
15. Analytics Ace - View analytics 10 times

**Technical Notes:**
- Create `badges` table: id, key, name, description, icon, condition_type, condition_value
- Create `user_badges` table: userId, badgeId, unlockedAt
- Badge check runs on relevant events (expense created, goal completed, etc.)

**Story Points:** 8

---

### Story 5.3: Monthly Budget Score

**As a** user  
**I want to** see a monthly "Budget Score" (0-100)  
**So that** I have a gamified view of my budget adherence

**Acceptance Criteria:**
- [ ] Score algorithm: weighted average of category budget adherence
- [ ] Visual score display: circular gauge with color gradient
- [ ] Score breakdown showing each category's contribution
- [ ] Historical score trend (last 6 months chart)
- [ ] Monthly score comparison with previous month
- [ ] Score descriptors: 90-100 "Excellent", 70-89 "Good", 50-69 "Fair", <50 "Needs Work"

**Score Calculation:**
- Each category: min(100, (budget - spent) / budget * 100)
- Final score: weighted average by budget amount
- Bonus points for categories significantly under budget

**Technical Notes:**
- Calculate on-demand or cache daily
- Store in `monthly_scores` table: userId, year, month, score, breakdown (JSONB)
- Endpoint: GET `/api/analytics/budget-score`

**Story Points:** 5

---

## Summary

| Epic | Stories | Total Points |
|------|---------|--------------|
| Epic 1: Conversational Expense Entry | 3 | 21 |
| Epic 2: Savings Goals Tracker | 3 | 13 |
| Epic 3: PWA with Offline Mode | 3 | 21 |
| Epic 4: Expense Splitting | 3 | 13 |
| Epic 5: Achievement Badges & Streaks | 3 | 18 |
| **TOTAL** | **15** | **86** |

---

## Recommended Sprint Sequence

**Sprint 1-2: Foundation & Quick Wins**
- Epic 2: Savings Goals Tracker (13 points) - High value, lower complexity
- Story 5.1: Logging Streak Tracker (5 points) - Quick engagement win

**Sprint 3-4: PWA & Engagement**
- Epic 3: PWA with Offline Mode (21 points) - Technical foundation
- Stories 5.2, 5.3: Badges & Score (13 points) - Complete gamification

**Sprint 5-6: AI & Social**
- Epic 1: Conversational Entry (21 points) - AI-powered features
- Epic 4: Expense Splitting (13 points) - Social features
