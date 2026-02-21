# ExpenseTracker Architecture Diagrams

> Generated: February 21, 2026  
> Author: Paige (Technical Writer)

This document contains comprehensive architecture diagrams for the ExpenseTracker application.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Data Flow Diagram](#2-data-flow-diagram)
3. [Authentication Sequence](#3-authentication-sequence)
4. [Receipt Scanning Sequence](#4-receipt-scanning-sequence)
5. [Expense CRUD Sequence](#5-expense-crud-sequence)
6. [Entity Relationship Diagram](#6-entity-relationship-diagram)

---

## 1. System Architecture

High-level view of the system's main containers and their interactions.

```mermaid
graph TB
    subgraph Client[Client Layer - React SPA]
        direction TB
        UI[UI Components]
        Pages[Pages]
        Hooks[Custom Hooks]
        QueryClient[React Query]
        Router[Wouter Router]
    end

    subgraph Server[Server Layer - Express.js]
        direction TB
        API[REST API Routes]
        Auth[Authentication]
        RateLimit[Rate Limiting]
        Storage[Storage Layer]
    end

    subgraph AI[AI Services]
        direction TB
        OpenAI[OpenAI GPT-4o]
        ReceiptScan[Receipt Scanning]
        Recommendations[Spending Recommendations]
    end

    subgraph Database[Database Layer]
        direction TB
        Postgres[(PostgreSQL 16)]
        Drizzle[Drizzle ORM]
    end

    subgraph External[External Services]
        Frankfurter[Frankfurter API]
    end

    Pages --> UI
    Pages --> Hooks
    Pages --> QueryClient
    Router --> Pages

    QueryClient -->|HTTP REST| API
    UI -->|Image Upload| API

    API --> Auth
    API --> RateLimit
    API --> Storage

    API -->|Receipt Analysis| OpenAI
    OpenAI --> ReceiptScan
    OpenAI --> Recommendations

    Storage --> Drizzle
    Drizzle --> Postgres

    QueryClient -->|Exchange Rates| Frankfurter
```

### Component Details

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, Vite, TypeScript | Single Page Application |
| **UI Library** | Radix UI, shadcn/ui, Tailwind CSS | Accessible components |
| **State** | TanStack React Query | Server state caching |
| **Routing** | Wouter | Client-side routing |
| **Backend** | Express.js, Node.js | REST API server |
| **Database** | PostgreSQL 16, Drizzle ORM | Data persistence |
| **Auth** | Replit Auth OIDC, bcrypt | Identity management |
| **AI** | OpenAI GPT-4o Vision | Receipt scanning |
| **Rate Limiting** | express-rate-limit | API protection |

---

## 2. Data Flow Diagram

Shows how data flows through the application for key operations.

```mermaid
flowchart LR
    subgraph UserActions[User Actions]
        A1[View Dashboard]
        A2[Add Expense]
        A3[Scan Receipt]
        A4[View Analytics]
        A5[Set Budget]
        A6[Create Goal]
    end

    subgraph Frontend[React Frontend]
        F1[Dashboard Page]
        F2[Expense Form]
        F3[Receipt Upload]
        F4[Analytics Charts]
        F5[Budget Manager]
        F6[Goals Manager]
        Cache[(Query Cache)]
    end

    subgraph APILayer[REST API]
        E1[GET /expenses]
        E2[POST /expenses]
        E3[POST /scan-receipt]
        E4[GET /analytics]
        E5[POST /budgets]
        E6[POST /savings-goals]
    end

    subgraph Processing[Server Processing]
        P1[Aggregate Stats]
        P2[Validate and Store]
        P3[GPT-4o Vision]
        P4[Calculate Metrics]
        P5[Budget Tracking]
        P6[Goal Progress]
    end

    subgraph DB[PostgreSQL]
        D1[(expenses)]
        D2[(categories)]
        D3[(budgets)]
        D4[(savings_goals)]
        D5[(user_streaks)]
    end

    A1 --> F1
    A2 --> F2
    A3 --> F3
    A4 --> F4
    A5 --> F5
    A6 --> F6

    F1 <--> Cache
    F2 <--> Cache
    F4 <--> Cache

    F1 --> E1
    F2 --> E2
    F3 --> E3
    F4 --> E4
    F5 --> E5
    F6 --> E6

    E1 --> P1
    E2 --> P2
    E3 --> P3
    E4 --> P4
    E5 --> P5
    E6 --> P6

    P1 --> D1
    P2 --> D1
    P2 --> D2
    P3 --> D1
    P4 --> D1
    P5 --> D3
    P6 --> D4
    P6 --> D5
```

---

## 3. Authentication Sequence

Sequence diagram showing the authentication flow using Replit Auth (OIDC).

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as React Client
    participant S as Express Server
    participant R as Replit Auth
    participant DB as PostgreSQL

    U->>C: Click Sign In
    C->>S: GET /api/login
    S->>R: Redirect to OIDC Provider
    R->>U: Show Login Form
    U->>R: Enter Credentials
    R->>R: Validate Credentials
    R->>S: Callback with Auth Code
    S->>R: Exchange Code for Tokens
    R-->>S: Access Token and ID Token
    S->>S: Decode JWT Claims
    S->>DB: Upsert User Record
    DB-->>S: User Data
    S->>DB: Create Session
    DB-->>S: Session ID
    S->>S: Set Session Cookie
    S-->>C: Redirect to Dashboard
    C->>S: GET /api/auth/user
    S->>S: Validate Session
    S->>DB: Fetch User
    DB-->>S: User Data
    S-->>C: User JSON
    C->>C: Update Auth State
    C->>U: Show Authenticated UI
```

---

## 4. Receipt Scanning Sequence

Sequence diagram showing the AI-powered receipt scanning flow.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as React Client
    participant S as Express Server
    participant RL as Rate Limiter
    participant AI as OpenAI GPT-4o
    participant DB as PostgreSQL

    U->>C: Upload Receipt Image
    C->>C: Convert to Base64
    C->>S: POST /api/scan-receipt
    S->>RL: Check AI Rate Limit
    
    alt Rate Limit Exceeded
        RL-->>S: 429 Too Many Requests
        S-->>C: Error Response
        C->>U: Show Please Wait message
    else Rate Limit OK
        RL-->>S: Allow Request
        S->>AI: Send Image for Analysis
        Note over AI: GPT-4o Vision API extracts merchant, amount, date, category
        AI-->>S: Extracted Data JSON
        S->>S: Validate and Normalize Data
        S-->>C: Parsed Receipt Data
        C->>C: Pre-fill Expense Form
        C->>U: Show Pre-filled Form
        U->>C: Confirm and Save
        C->>S: POST /api/expenses
        S->>DB: Insert Expense
        DB-->>S: Created Expense
        S-->>C: Success Response
        C->>C: Invalidate Query Cache
        C->>U: Show Success Toast
    end
```

---

## 5. Expense CRUD Sequence

Sequence diagram showing expense creation with validation.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as React Client
    participant RHF as React Hook Form
    participant RQ as React Query
    participant S as Express Server
    participant Z as Zod Validator
    participant DB as PostgreSQL

    U->>C: Open Add Expense Form
    C->>RHF: Initialize Form State
    U->>RHF: Fill Form Fields
    U->>C: Click Save
    
    RHF->>RHF: Client-side Validation
    
    alt Validation Failed
        RHF-->>C: Show Field Errors
        C->>U: Display Error Messages
    else Validation Passed
        RHF->>RQ: Trigger Mutation
        RQ->>S: POST /api/expenses
        S->>Z: Validate Request Body
        
        alt Schema Invalid
            Z-->>S: Validation Errors
            S-->>RQ: 400 Bad Request
            RQ-->>C: Error Response
            C->>U: Show Server Errors
        else Schema Valid
            Z-->>S: Validated Data
            S->>DB: INSERT INTO expenses
            DB-->>S: New Expense Row
            S->>S: Check Badge Unlock
            S->>DB: UPDATE user_streaks
            DB-->>S: Updated Streak
            S-->>RQ: 201 Created
            RQ->>RQ: Invalidate Queries
            RQ-->>C: Success
            C->>U: Show Success Toast
        end
    end
```

---

## 6. Entity Relationship Diagram

Database schema showing all tables and their relationships.

```mermaid
erDiagram
    users ||--o{ categories : owns
    users ||--o{ expenses : creates
    users ||--o{ budgets : sets
    users ||--o{ recurring_expenses : schedules
    users ||--o{ savings_goals : tracks
    users ||--o| digest_preferences : configures
    users ||--o| user_streaks : maintains
    users ||--o{ user_badges : earns
    users ||--o{ sessions : has
    
    categories ||--o{ expenses : classifies
    categories ||--o{ budgets : limits
    categories ||--o{ recurring_expenses : categorizes
    
    savings_goals ||--o{ goal_contributions : receives

    users {
        varchar id PK
        varchar email UK
        varchar username UK
        varchar password_hash
        varchar auth_method
        varchar first_name
        varchar last_name
        varchar profile_image_url
        timestamp created_at
        timestamp updated_at
    }

    categories {
        serial id PK
        text name
        text icon
        varchar user_id FK
        timestamp created_at
    }

    expenses {
        serial id PK
        real amount
        varchar currency
        text description
        text merchant
        integer category_id FK
        timestamp date
        boolean has_receipt
        text receipt_url
        varchar user_id FK
        timestamp created_at
    }

    budgets {
        serial id PK
        varchar user_id FK
        integer category_id FK
        real monthly_limit
        timestamp created_at
    }

    recurring_expenses {
        serial id PK
        varchar user_id FK
        real amount
        varchar currency
        text merchant
        text description
        integer category_id FK
        text frequency
        timestamp start_date
        timestamp end_date
        timestamp last_generated_date
        boolean is_active
        timestamp created_at
    }

    savings_goals {
        serial id PK
        varchar user_id FK
        text name
        real target_amount
        real current_amount
        varchar currency
        timestamp target_date
        text status
        timestamp created_at
    }

    goal_contributions {
        serial id PK
        integer goal_id FK
        real amount
        text note
        timestamp contributed_at
    }

    digest_preferences {
        serial id PK
        varchar user_id FK
        boolean enabled
        text frequency
        text email
        boolean include_categories
        boolean include_budget_alerts
        boolean include_top_merchants
        timestamp created_at
    }

    user_streaks {
        serial id PK
        varchar user_id FK
        integer current_streak
        integer longest_streak
        timestamp last_activity_date
        timestamp updated_at
    }

    user_badges {
        serial id PK
        varchar user_id FK
        text badge_type
        timestamp unlocked_at
    }

    sessions {
        varchar sid PK
        jsonb sess
        timestamp expire
    }
```

---

## Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/user` | GET | Get authenticated user |
| `/api/expenses` | GET, POST | List or create expenses |
| `/api/expenses/:id` | GET, PUT, DELETE | Single expense CRUD |
| `/api/expenses/export/csv` | GET | Export expenses to CSV |
| `/api/categories` | GET, POST | List or create categories |
| `/api/budgets` | GET, POST | List or create budgets |
| `/api/savings-goals` | GET, POST | List or create goals |
| `/api/scan-receipt` | POST | AI receipt scanning |
| `/api/recommendations` | GET | AI spending insights |
| `/api/analytics/category-spending` | GET | Category breakdown |
| `/api/analytics/spending-trend` | GET | Spending over time |
| `/api/analytics/summary` | GET | Dashboard stats |

---

## Rate Limits

| Scope | Limit | Window |
|-------|-------|--------|
| Global API | 100 requests | 1 minute |
| AI Endpoints | 5 requests | 1 minute |

---

## Supported Currencies

USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, MXN, PHP
