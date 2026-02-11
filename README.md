# ExpenseTracker

A full-stack personal finance application for tracking expenses, scanning receipts with AI, managing budgets, and getting smart spending insights.

Built with React, Express, PostgreSQL, and OpenAI GPT-4o.

## Features

### Core Expense Management
- **Add, edit, and delete expenses** with merchant, amount, category, date, and multi-currency support
- **11 supported currencies** (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, MXN, PHP) with live exchange rates via the Frankfurter API
- **Server-side search** with debounced input across merchant and description fields
- **Paginated expense list** (20 per page) with date range and category filtering
- **CSV export** for tax reporting, accounting, or backups
- **Delete confirmation dialogs** to prevent accidental data loss

### AI-Powered Features
- **Receipt scanning** — upload a photo and GPT-4o Vision extracts the merchant, amount, date, and suggested category automatically
- **Spending recommendations** — GPT-4o analyzes your spending patterns and provides 3 actionable suggestions to reduce costs

### Budgets
- Set **monthly spending limits per category**
- Visual progress bars with color-coded status (green < 80%, yellow 80-99%, red 100%+)
- Real-time tracking of spent vs. limit for the current month

### Recurring Expenses
- Track subscriptions and regular payments (daily, weekly, monthly, yearly)
- Pause/resume individual recurring expenses
- **Auto-generate** due expenses with one click

### Spending Digest
- Configurable **daily or weekly** email digest of your spending
- Toggle sections: category breakdown, budget alerts, top merchants
- **Live preview** of digest content in-app
- Send test digest via email (mailto link)

### Analytics & Reporting
- **Dashboard** with summary stat cards (total, this month, this week, daily average)
- **Category spending** breakdown (pie/bar charts)
- **Spending trend** line chart (30-day default, customizable range)
- **Monthly comparison** with percentage change
- **Weekly breakdown** by day of week
- **Drill-down period views** — yearly, monthly, daily
- **Annual report** generation with email delivery

### Other
- **Dark / light theme** toggle
- **Responsive sidebar** navigation
- **Rate limiting** — global (100 req/min) and AI-specific (5 req/min per user)
- **Input validation** with Zod schemas (amount bounds, string length limits, email validation)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS |
| UI Components | Radix UI, shadcn/ui, Lucide icons |
| State & Data | TanStack React Query, React Hook Form, Zod |
| Charts | Recharts |
| Routing | Wouter |
| Backend | Node.js, Express |
| Database | PostgreSQL 16, Drizzle ORM |
| AI | OpenAI GPT-4o (receipt scanning + recommendations) |
| Auth | Replit Auth (OpenID Connect) |
| Rate Limiting | express-rate-limit |

## Project Structure

```
Receipt-Tracker/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI & feature components
│   │   │   └── ui/             # Radix/shadcn primitives
│   │   ├── hooks/              # Custom hooks (useAuth, useCurrency)
│   │   ├── lib/                # Query client, utilities
│   │   └── pages/              # Route pages
│   │       ├── Dashboard.tsx
│   │       ├── Expenses.tsx
│   │       ├── Analytics.tsx
│   │       ├── Categories.tsx
│   │       ├── Budgets.tsx
│   │       ├── RecurringExpenses.tsx
│   │       ├── DigestSettings.tsx
│   │       ├── AIRecommendations.tsx
│   │       ├── Landing.tsx
│   │       └── not-found.tsx
│   └── public/                 # Static assets
├── server/                     # Express backend
│   ├── index.ts                # Server entry point
│   ├── routes.ts               # All API endpoints
│   ├── storage.ts              # Database queries (Drizzle)
│   ├── rateLimit.ts            # Rate limiter config
│   ├── replitAuth.ts           # Auth middleware
│   └── db.ts                   # Database connection
├── shared/                     # Shared types & schemas
│   └── schema.ts               # Drizzle tables + Zod validation
├── drizzle.config.ts
├── vite.config.ts
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16
- OpenAI API key (for receipt scanning and AI recommendations)

### Installation

```bash
# Clone the repository
git clone https://github.com/alvinjchua888/expense-tracker-personal.git
cd expense-tracker-personal

# Install dependencies
npm install

# Set environment variables
export DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker"
export OPENAI_API_KEY="sk-..."

# Push the database schema
npm run db:push

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5000`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push schema changes to database |

## API Endpoints

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses (paginated, filterable) |
| GET | `/api/expenses/:id` | Get single expense |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/export/csv` | Export as CSV |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | List budgets |
| GET | `/api/budgets/progress` | Budget progress with spending |
| POST | `/api/budgets` | Create budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |

### Recurring Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recurring-expenses` | List recurring expenses |
| POST | `/api/recurring-expenses` | Create recurring expense |
| PUT | `/api/recurring-expenses/:id` | Update recurring expense |
| DELETE | `/api/recurring-expenses/:id` | Delete recurring expense |
| POST | `/api/recurring-expenses/generate` | Generate due expenses |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/category-spending` | Spending by category |
| GET | `/api/analytics/summary-stats` | Summary statistics |
| GET | `/api/analytics/monthly-comparison` | Month-over-month comparison |
| GET | `/api/analytics/weekly-breakdown` | Spending by day of week |
| GET | `/api/analytics/spending-trend` | Daily spending trend |
| GET | `/api/analytics/period-spending` | Period spending (year/month/day) |
| GET | `/api/analytics/annual-report` | Annual report data |
| POST | `/api/analytics/email-report` | Generate email report |

### AI & Integrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/recommendations` | AI spending recommendations |
| POST | `/api/receipt/scan` | Receipt OCR scanning |
| GET | `/api/exchange-rates` | Currency exchange rates |

### Digest
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/digest/preferences` | Get digest settings |
| PUT | `/api/digest/preferences` | Update digest settings |
| POST | `/api/digest/preview` | Preview digest content |
| POST | `/api/digest/send` | Send digest email |

## Database Schema

The app uses 7 tables (plus sessions for auth):

- **users** — User profiles from Replit Auth
- **expenses** — Individual expense records with amount, currency, merchant, category, date
- **categories** — User-defined categories with icons (10 defaults seeded on signup)
- **budgets** — Monthly spending limits per category (unique per user+category)
- **recurringExpenses** — Recurring charge templates with frequency and auto-generation
- **digestPreferences** — Email digest configuration (unique per user)
- **conversations / messages** — Chat history (optional)

## License

MIT
