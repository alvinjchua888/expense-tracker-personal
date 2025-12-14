# Daily Expense Tracking App

## Overview

A full-stack daily expense tracking application built with React and Express. The app allows users to track expenses, categorize spending, upload receipts with AI-powered data extraction, and view analytics through interactive charts. Key features include expense CRUD operations, category management, date range filtering, spending trends visualization, and dark mode support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode)
- **Charts**: Recharts for data visualization (pie charts, line charts, bar charts)
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Pattern**: RESTful API endpoints under `/api/*`
- **Build Tool**: Vite for frontend, esbuild for server bundling

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Tables**: users, categories, expenses, conversations, messages
- **Migrations**: Drizzle Kit for database migrations in `./migrations`

### Key Design Decisions
1. **Shared Schema**: Database types and Zod validation schemas are shared between frontend and backend via `@shared/*` path alias
2. **Storage Pattern**: `IStorage` interface abstracts database operations for testability
3. **API Request Helper**: Centralized `apiRequest` function handles fetch with error handling
4. **Component Architecture**: Reusable components in `client/src/components/` with example files for documentation

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Route pages
│       ├── hooks/       # Custom React hooks
│       └── lib/         # Utilities
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared types and schemas
│   └── schema.ts     # Drizzle table definitions
└── migrations/       # Database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle ORM**: Database client and migration management
- **connect-pg-simple**: PostgreSQL session store

### AI Services
- **OpenAI API**: Used for receipt image analysis and chat functionality
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- **Image Generation**: `gpt-image-1` model for image generation features

### Frontend Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Recharts**: Chart library for analytics visualization
- **date-fns**: Date manipulation utilities
- **react-day-picker**: Calendar component for date selection

### Development Tools
- **Vite**: Development server and build tool
- **TypeScript**: Type checking across the stack
- **Tailwind CSS**: Utility-first CSS framework