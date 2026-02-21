# ExpenseTracker - Technical Documentation

> **Generated:** 2026-02-21 | **Scan Level:** Quick | **Workflow Version:** 1.2.0

## Overview

ExpenseTracker is a full-stack personal finance application for tracking expenses, scanning receipts with AI, managing budgets, and getting smart spending insights. Built with React, Express, PostgreSQL, and OpenAI GPT-4o.

## Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture Overview](architecture-overview.md) | System architecture, data flow, and component interactions |
| [Architecture Diagrams](architecture-diagrams.md) | Detailed Mermaid diagrams for all system flows |
| [API Reference](api-reference.md) | Complete REST API documentation with 51 endpoints |
| [Data Models](data-models.md) | Database schema with 11 tables using Drizzle ORM |
| [Frontend Components](frontend-components.md) | React component inventory and UI patterns |
| [Development Guide](development-guide.md) | Setup, build, and deployment instructions |

---

## Quick Reference

### Project Classification

| Property | Value |
|----------|-------|
| **Repository Type** | Multi-part (client/server/shared) |
| **Project Type** | Full-stack Web Application |
| **Primary Language** | TypeScript |
| **Frontend** | React 18 + Vite 5 + Tailwind CSS |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL 16 + Drizzle ORM |
| **AI Integration** | OpenAI GPT-4o |
| **Authentication** | Replit Auth (OpenID Connect) + Local Auth |

### Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                           │
├─────────────────────────────────────────────────────────────────┤
│  React 18  │  Vite 5  │  TanStack Query  │  Wouter  │  Recharts │
│  Radix UI  │  shadcn/ui  │  Tailwind CSS  │  Lucide Icons       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER (Express)                          │
├─────────────────────────────────────────────────────────────────┤
│  Express 4  │  Drizzle ORM  │  Zod Validation  │  OpenAI SDK    │
│  Rate Limiting  │  Session Management  │  Passport.js           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ SQL
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────┤
│  11 Tables  │  Drizzle Migrations  │  JSONB for complex data    │
└─────────────────────────────────────────────────────────────────┘
```

### Feature Summary

| Category | Features |
|----------|----------|
| **Expense Management** | CRUD, multi-currency (11 currencies), CSV export, search/filter |
| **AI Features** | Receipt scanning (GPT-4o Vision), spending recommendations, natural language input |
| **Budgets** | Per-category monthly limits, visual progress, alerts |
| **Recurring** | Subscriptions, pause/resume, auto-generation |
| **Analytics** | Dashboard stats, charts, trends, annual reports |
| **Gamification** | Streaks, badges, budget scores |
| **Goals** | Savings goals, contributions tracking |

### Directory Structure

```
Receipt-Tracker/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # 16 feature components + ui/
│   │   ├── hooks/              # 5 custom hooks
│   │   ├── lib/                # Query client, utilities
│   │   └── pages/              # 13 route pages
│   └── public/                 # PWA manifest, service worker
├── server/                     # Express backend
│   ├── index.ts                # Server entry point
│   ├── routes.ts               # 51 API endpoints
│   ├── storage.ts              # Database operations
│   ├── db.ts                   # PostgreSQL connection
│   ├── replitAuth.ts           # Auth middleware
│   └── rateLimit.ts            # Rate limiter config
├── shared/                     # Shared code
│   ├── schema.ts               # Drizzle tables + Zod schemas
│   └── models/                 # TypeScript models
└── docs/                       # Documentation (you are here)
```

---

## Key Metrics

| Metric | Value |
|--------|-------|
| **API Endpoints** | 51 |
| **Database Tables** | 11 |
| **React Pages** | 13 |
| **UI Components** | 16+ custom + shadcn/ui library |
| **Supported Currencies** | 11 (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, MXN, PHP) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
# DATABASE_URL=postgresql://...
# OPENAI_API_KEY=sk-...

# Push database schema
npm run db:push

# Start development server
npm run dev

# Build for production
npm run build && npm start
```

---

*Documentation generated by BMAD Tech Writer • [Document Project Workflow v1.2.0]*
