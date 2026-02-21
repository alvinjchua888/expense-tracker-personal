# Architecture Overview

> **Generated:** 2026-02-21 | **Part of:** [Technical Documentation](index.md)

## System Architecture

ExpenseTracker follows a **multi-part architecture** with clear separation between frontend, backend, and shared code.

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React UI<br/>Vite + Tailwind]
        RQ[TanStack Query<br/>State Management]
        Router[Wouter<br/>Client Routing]
    end

    subgraph "API Layer"
        Express[Express Server]
        Auth[Auth Middleware<br/>Replit OIDC + Local]
        RL[Rate Limiter]
        Val[Zod Validation]
    end

    subgraph "Integration Layer"
        OpenAI[OpenAI GPT-4o<br/>Vision + Chat]
        FX[Frankfurter API<br/>Exchange Rates]
    end

    subgraph "Data Layer"
        Drizzle[Drizzle ORM]
        PG[(PostgreSQL 16)]
    end

    UI --> RQ
    RQ --> Express
    Router --> UI
    Express --> Auth
    Auth --> RL
    RL --> Val
    Val --> Drizzle
    Drizzle --> PG
    Express --> OpenAI
    Express --> FX
```

## Component Architecture

### Frontend (React)

```mermaid
graph LR
    subgraph "Pages"
        Dashboard
        Expenses
        Analytics
        Categories
        Budgets
        Goals
        Badges
        AIRecommendations
    end

    subgraph "Components"
        ExpenseForm
        ExpenseList
        ReceiptUpload
        AnalyticsCharts
        StatCard
        StreakWidget
        BudgetScoreWidget
    end

    subgraph "Hooks"
        useAuth
        useCurrency
        useMobile
        useToast
        useOfflineQueue
    end

    subgraph "State"
        QueryClient[TanStack Query]
    end

    Pages --> Components
    Components --> Hooks
    Hooks --> QueryClient
```

### Backend (Express)

```mermaid
graph TB
    subgraph "Entry Point"
        Index[server/index.ts]
    end

    subgraph "Middleware"
        Session[express-session]
        Auth[replitAuth.ts]
        RateLimit[rateLimit.ts]
        Static[static.ts]
    end

    subgraph "Routes"
        Routes[routes.ts<br/>51 endpoints]
    end

    subgraph "Data Access"
        Storage[storage.ts]
        DB[db.ts]
    end

    subgraph "External"
        OpenAI[replit_integrations/]
        GitHub[github-client.ts]
    end

    Index --> Session
    Session --> Auth
    Auth --> RateLimit
    RateLimit --> Routes
    Routes --> Storage
    Storage --> DB
    Routes --> OpenAI
```

## Data Flow

### Expense Creation Flow

```mermaid
sequenceDiagram
    participant User
    participant React
    participant Express
    participant Drizzle
    participant PostgreSQL

    User->>React: Submit expense form
    React->>Express: POST /api/expenses
    Express->>Express: Validate with Zod
    Express->>Drizzle: createExpense()
    Drizzle->>PostgreSQL: INSERT INTO expenses
    PostgreSQL-->>Drizzle: Return new row
    Drizzle-->>Express: Expense object
    Express->>Express: Update streak (async)
    Express->>Express: Check badges (async)
    Express-->>React: 201 Created + expense
    React->>React: Invalidate queries
    React-->>User: Show success toast
```

### Receipt Scanning Flow

```mermaid
sequenceDiagram
    participant User
    participant React
    participant Express
    participant OpenAI

    User->>React: Upload receipt image
    React->>Express: POST /api/receipt/scan
    Express->>Express: Check rate limit (5/min)
    Express->>OpenAI: GPT-4o Vision API
    Note right of OpenAI: Extract merchant,<br/>amount, date,<br/>category
    OpenAI-->>Express: Structured response
    Express-->>React: Parsed receipt data
    React->>React: Pre-fill expense form
    React-->>User: Show extracted data
```

## Security Architecture

### Authentication Flow

```mermaid
graph TB
    subgraph "Auth Methods"
        OIDC[Replit OIDC]
        Local[Local Username/Password]
    end

    subgraph "Middleware"
        Session[express-session]
        Passport[Passport.js]
        IsAuth[isAuthenticated]
    end

    subgraph "Storage"
        Sessions[(sessions table)]
        Users[(users table)]
    end

    OIDC --> Passport
    Local --> Passport
    Passport --> Session
    Session --> Sessions
    Session --> IsAuth
    Passport --> Users
```

### Rate Limiting

| Limiter | Limit | Window | Scope |
|---------|-------|--------|-------|
| **Global** | 100 requests | 1 minute | Per IP |
| **AI Endpoints** | 5 requests | 1 minute | Per user |

**AI-Limited Endpoints:**
- `POST /api/ai/recommendations`
- `POST /api/receipt/scan`
- `POST /api/expenses/parse-natural`
- `POST /api/chat/expense-query`

## Database Architecture

### Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ expenses : "has"
    users ||--o{ categories : "owns"
    users ||--o{ budgets : "sets"
    users ||--o{ recurring_expenses : "schedules"
    users ||--o{ savings_goals : "creates"
    users ||--o{ digest_preferences : "configures"
    users ||--o{ user_streaks : "tracks"
    users ||--o{ user_badges : "earns"
    users ||--o{ monthly_scores : "records"
    
    categories ||--o{ expenses : "categorizes"
    categories ||--o{ budgets : "limits"
    categories ||--o{ recurring_expenses : "categorizes"
    categories ||--o{ savings_goals : "links to"
    
    savings_goals ||--o{ goal_contributions : "receives"

    users {
        varchar id PK
        varchar email UK
        varchar username UK
        varchar password_hash
        varchar auth_method
        timestamp created_at
    }

    expenses {
        serial id PK
        real amount
        varchar currency
        text merchant
        integer category_id FK
        varchar user_id FK
        timestamp date
    }

    categories {
        serial id PK
        text name
        text icon
        varchar user_id FK
    }

    budgets {
        serial id PK
        varchar user_id FK
        integer category_id FK
        real monthly_limit
    }

    savings_goals {
        serial id PK
        varchar user_id FK
        varchar name
        real target_amount
        real current_amount
        timestamp target_date
    }
```

## Deployment Architecture

### Production Build

```mermaid
graph LR
    subgraph "Build Process"
        TSX[tsx script/build.ts]
        Vite[Vite Build]
        ESBuild[ESBuild]
    end

    subgraph "Output"
        Public[dist/public/<br/>React SPA]
        Server[dist/index.cjs<br/>Express Server]
    end

    subgraph "Runtime"
        Node[Node.js]
        PG[(PostgreSQL)]
    end

    TSX --> Vite
    TSX --> ESBuild
    Vite --> Public
    ESBuild --> Server
    Server --> Node
    Node --> PG
    Node --> Public
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for GPT-4o |
| `SESSION_SECRET` | ⚪ | Session encryption key (auto-generated if missing) |
| `NODE_ENV` | ⚪ | `development` or `production` |

---

*[Back to Documentation Index](index.md)*
