# API Reference

> **Generated:** 2026-02-21 | **Part of:** [Technical Documentation](index.md)

## Overview

ExpenseTracker exposes **51 REST API endpoints** organized by resource. All endpoints (except exchange rates) require authentication.

**Base URL:** `/api`

**Authentication:** Session-based (Replit OIDC or Local credentials)

**Rate Limits:**
- Global: 100 requests/minute per IP
- AI endpoints: 5 requests/minute per user

---

## Authentication

### Get Current User
```
GET /api/auth/user
```
Returns the authenticated user's profile.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "profileImageUrl": "https://...",
  "authMethod": "oidc"
}
```

---

## Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | List all categories for user |
| `GET` | `/api/categories/:id` | Get single category |
| `POST` | `/api/categories` | Create category |
| `PUT` | `/api/categories/:id` | Update category |
| `DELETE` | `/api/categories/:id` | Delete category |

### Create Category
```
POST /api/categories
```
**Body:**
```json
{
  "name": "Entertainment",
  "icon": "Film"
}
```

**Validation:**
- `name`: required, 1-100 characters
- `icon`: optional, default "Shopping"

---

## Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/expenses` | List expenses (paginated) |
| `GET` | `/api/expenses/:id` | Get single expense |
| `POST` | `/api/expenses` | Create expense |
| `PUT` | `/api/expenses/:id` | Update expense |
| `DELETE` | `/api/expenses/:id` | Delete expense |
| `GET` | `/api/expenses/export/csv` | Export as CSV |

### List Expenses
```
GET /api/expenses?limit=20&offset=0&startDate=2026-01-01&endDate=2026-01-31&categoryId=1&search=coffee
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Max 100 |
| `offset` | number | 0 | Pagination offset |
| `startDate` | ISO date | - | Filter start |
| `endDate` | ISO date | - | Filter end |
| `categoryId` | number | - | Filter by category |
| `search` | string | - | Search merchant/description |

**Response:**
```json
{
  "data": [...],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

### Create Expense
```
POST /api/expenses
```
**Body:**
```json
{
  "amount": 25.50,
  "currency": "USD",
  "merchant": "Starbucks",
  "description": "Morning coffee",
  "categoryId": 2,
  "date": "2026-02-21T08:30:00Z",
  "hasReceipt": false
}
```

**Validation:**
- `amount`: required, positive, max 999,999,999
- `merchant`: required, 1-200 characters
- `currency`: one of: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, MXN, PHP
- `date`: required, ISO 8601 timestamp

**Side Effects:**
- Updates user streak (async)
- Checks for badge unlocks (async)

---

## Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/category-spending` | Spending by category |
| `GET` | `/api/analytics/spending-trend` | Daily spending trend |
| `GET` | `/api/analytics/summary-stats` | Summary statistics |
| `GET` | `/api/analytics/monthly-comparison` | Month-over-month |
| `GET` | `/api/analytics/weekly-breakdown` | By day of week |
| `GET` | `/api/analytics/period-spending` | By year/month/day |
| `GET` | `/api/analytics/annual-report` | Full year report |
| `POST` | `/api/analytics/email-report` | Email annual report |
| `GET` | `/api/analytics/budget-score` | Current budget score |
| `GET` | `/api/analytics/budget-score/history` | Score history |

### Get Summary Stats
```
GET /api/analytics/summary-stats
```

**Response:**
```json
{
  "totalSpending": 5420.50,
  "avgPerDay": 174.85,
  "highestExpense": 850.00,
  "transactionCount": 45,
  "avgPerTransaction": 120.45
}
```

### Get Budget Score
```
GET /api/analytics/budget-score?year=2026&month=2
```

**Response:**
```json
{
  "score": 78.5,
  "breakdown": [
    {
      "categoryId": 1,
      "categoryName": "Groceries",
      "categoryIcon": "ShoppingCart",
      "budget": 500,
      "spent": 425,
      "score": 85,
      "weight": 0.25
    }
  ]
}
```

---

## Budgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/budgets` | List all budgets |
| `GET` | `/api/budgets/progress` | Budget progress with spending |
| `POST` | `/api/budgets` | Create budget |
| `PUT` | `/api/budgets/:id` | Update budget |
| `DELETE` | `/api/budgets/:id` | Delete budget |

### Create Budget
```
POST /api/budgets
```
**Body:**
```json
{
  "categoryId": 1,
  "monthlyLimit": 500
}
```

**Validation:**
- `categoryId`: required, valid category ID
- `monthlyLimit`: required, positive, max 999,999,999
- One budget per category per user (unique constraint)

---

## Recurring Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/recurring-expenses` | List recurring expenses |
| `POST` | `/api/recurring-expenses` | Create recurring expense |
| `PUT` | `/api/recurring-expenses/:id` | Update recurring expense |
| `DELETE` | `/api/recurring-expenses/:id` | Delete recurring expense |
| `POST` | `/api/recurring-expenses/generate` | Generate due expenses |

### Create Recurring Expense
```
POST /api/recurring-expenses
```
**Body:**
```json
{
  "amount": 14.99,
  "currency": "USD",
  "merchant": "Netflix",
  "description": "Monthly subscription",
  "categoryId": 6,
  "frequency": "monthly",
  "startDate": "2026-01-15T00:00:00Z",
  "isActive": true
}
```

**Frequency Options:** `daily`, `weekly`, `monthly`, `yearly`

---

## Savings Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/goals` | List all goals |
| `GET` | `/api/goals/:id` | Get single goal |
| `POST` | `/api/goals` | Create goal |
| `PUT` | `/api/goals/:id` | Update goal |
| `DELETE` | `/api/goals/:id` | Delete goal |
| `GET` | `/api/goals/:id/contributions` | List contributions |
| `POST` | `/api/goals/:id/contributions` | Add contribution |
| `DELETE` | `/api/goals/:id/contributions/:contribId` | Delete contribution |

### Create Goal
```
POST /api/goals
```
**Body:**
```json
{
  "name": "Emergency Fund",
  "targetAmount": 10000,
  "targetDate": "2026-12-31T00:00:00Z",
  "icon": "🏦",
  "color": "#10B981",
  "linkedCategoryId": null
}
```

---

## Digest Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/digest/preferences` | Get digest settings |
| `PUT` | `/api/digest/preferences` | Update settings |
| `POST` | `/api/digest/preview` | Preview digest content |
| `POST` | `/api/digest/send` | Send test digest |

### Update Preferences
```
PUT /api/digest/preferences
```
**Body:**
```json
{
  "enabled": true,
  "frequency": "weekly",
  "email": "user@example.com",
  "includeCategories": true,
  "includeBudgetAlerts": true,
  "includeTopMerchants": true
}
```

---

## AI Endpoints

> ⚠️ **Rate Limited:** 5 requests/minute per user

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/recommendations` | Get spending recommendations |
| `POST` | `/api/receipt/scan` | Scan receipt image |
| `POST` | `/api/expenses/parse-natural` | Parse natural language |
| `POST` | `/api/chat/expense-query` | Chat about expenses |

### Scan Receipt
```
POST /api/receipt/scan
```
**Body:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "merchant": "Whole Foods",
  "amount": 87.34,
  "date": "2026-02-20",
  "suggestedCategory": "Groceries",
  "confidence": 0.95
}
```

### Parse Natural Language
```
POST /api/expenses/parse-natural
```
**Body:**
```json
{
  "text": "Spent $45 at Target yesterday for groceries"
}
```

---

## Gamification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/streak` | Get user's current streak |
| `GET` | `/api/badges` | List earned badges |

### Get Streak
```
GET /api/streak
```
**Response:**
```json
{
  "currentStreak": 15,
  "longestStreak": 42,
  "lastExpenseDate": "2026-02-21T10:30:00Z",
  "streakFreezesUsed": 2
}
```

---

## Exchange Rates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/exchange-rates` | Get current rates |

> ℹ️ This endpoint does NOT require authentication.

**Response:** Live rates from Frankfurter API for all 11 supported currencies.

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Human-readable error message",
  "details": [
    {
      "path": ["amount"],
      "message": "Amount must be positive"
    }
  ]
}
```

| Status | Meaning |
|--------|---------|
| `400` | Validation error |
| `401` | Not authenticated |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Server error |

---

*[Back to Documentation Index](index.md)*
