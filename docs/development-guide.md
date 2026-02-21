# Development Guide

> **Generated:** 2026-02-21 | **Part of:** [Technical Documentation](index.md)

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 20+ | Runtime |
| npm | 10+ | Package manager |
| PostgreSQL | 16+ | Database |
| OpenAI API Key | - | AI features |

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/alvinjchua888/expense-tracker-personal.git
cd Receipt-Tracker
npm install
```

### 2. Configure Environment

Create `.env` file in project root:

```bash
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/expense_tracker
OPENAI_API_KEY=sk-...

# Optional
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

### 3. Initialize Database

```bash
# Push schema to database
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

---

## NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `tsx server/index.ts` | Start dev server with hot reload |
| `build` | `tsx script/build.ts` | Build for production |
| `start` | `node dist/index.cjs` | Run production build |
| `check` | `tsc` | TypeScript type checking |
| `db:push` | `drizzle-kit push` | Push schema changes |

---

## Project Structure

```
Receipt-Tracker/
├── client/                     # React frontend (Vite)
│   ├── index.html              # HTML entry point
│   ├── public/                 # Static assets
│   │   ├── manifest.json       # PWA manifest
│   │   └── sw.js               # Service worker
│   └── src/
│       ├── App.tsx             # Root component
│       ├── main.tsx            # Entry point
│       ├── index.css           # Global styles
│       ├── components/         # React components
│       ├── hooks/              # Custom hooks
│       ├── lib/                # Utilities
│       └── pages/              # Route pages
│
├── server/                     # Express backend
│   ├── index.ts                # Server entry
│   ├── routes.ts               # API routes (51 endpoints)
│   ├── storage.ts              # Database operations
│   ├── db.ts                   # PostgreSQL connection
│   ├── replitAuth.ts           # Auth middleware
│   ├── rateLimit.ts            # Rate limiting
│   └── replit_integrations/    # AI integrations
│       └── image/client.ts     # OpenAI client
│
├── shared/                     # Shared code
│   ├── schema.ts               # Drizzle schema + Zod
│   └── models/                 # TypeScript models
│
├── docs/                       # Documentation
├── _bmad/                      # BMAD workflow files
├── _bmad-output/               # Generated artifacts
│
├── drizzle.config.ts           # Drizzle ORM config
├── vite.config.ts              # Vite config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

---

## Development Workflow

### Adding a New Feature

1. **Database Changes** (if needed)
   ```typescript
   // shared/schema.ts
   export const newTable = pgTable("new_table", {
     id: serial("id").primaryKey(),
     // ... columns
   });
   
   export const insertNewTableSchema = createInsertSchema(newTable);
   ```

2. **Push Schema**
   ```bash
   npm run db:push
   ```

3. **Add Storage Methods**
   ```typescript
   // server/storage.ts
   async getNewItems(userId: string): Promise<NewItem[]> {
     return db.select().from(newTable).where(eq(newTable.userId, userId));
   }
   ```

4. **Create API Routes**
   ```typescript
   // server/routes.ts
   app.get("/api/new-items", isAuthenticated, async (req, res) => {
     const items = await storage.getNewItems(req.user.claims.sub);
     res.json(items);
   });
   ```

5. **Create React Component**
   ```typescript
   // client/src/components/NewFeature.tsx
   import { useQuery } from '@tanstack/react-query';
   
   export function NewFeature() {
     const { data } = useQuery({
       queryKey: ['new-items'],
       queryFn: () => fetch('/api/new-items').then(r => r.json())
     });
     // ...
   }
   ```

6. **Add Page Route**
   ```typescript
   // client/src/App.tsx
   <Route path="/new-feature" component={NewFeaturePage} />
   ```

---

## Build Process

### Development Build

```bash
npm run dev
```

- Vite dev server with HMR for frontend
- tsx watch mode for backend
- Combined on port 5000

### Production Build

```bash
npm run build
```

**Build Steps (script/build.ts):**

1. **Vite Build** → `dist/public/` (React SPA)
2. **ESBuild** → `dist/index.cjs` (Express server)

**Output:**
```
dist/
├── public/          # React SPA assets
│   ├── index.html
│   ├── assets/
│   └── ...
└── index.cjs        # Node.js server bundle
```

### Running Production

```bash
NODE_ENV=production npm start
```

---

## Database Management

### Drizzle ORM

Schema is defined in `shared/schema.ts` using Drizzle's type-safe syntax.

```typescript
// Example table definition
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  amount: real("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("PHP"),
  merchant: text("merchant").notNull(),
  // ...
});
```

### Common Commands

```bash
# Push schema changes (no migration files)
npm run db:push

# Generate migration files
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Open Drizzle Studio (database GUI)
npx drizzle-kit studio
```

### Configuration

```typescript
// drizzle.config.ts
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

---

## Authentication

### Replit Auth (OIDC)

Primary auth method using Replit's OpenID Connect.

```typescript
// server/replitAuth.ts
export async function setupAuth(app: Express) {
  // Session setup with PostgreSQL store
  // OpenID Connect client configuration
  // Login/logout routes
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Not authenticated" });
};
```

### Local Auth

Alternative username/password authentication.

```typescript
// Registration schema
export const registerUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  email: z.string().email().optional(),
});

// Passwords hashed with bcrypt
const hash = await bcrypt.hash(password, 10);
```

---

## API Development

### Route Structure

All routes in `server/routes.ts`:

```typescript
export async function registerRoutes(httpServer: Server, app: Express) {
  await setupAuth(app);

  // Resource routes
  app.get("/api/categories", isAuthenticated, async (req, res) => { ... });
  app.post("/api/categories", isAuthenticated, async (req, res) => { ... });
  
  // AI routes with rate limiting
  app.post("/api/receipt/scan", isAuthenticated, aiLimiter, async (req, res) => { ... });

  return httpServer;
}
```

### Validation Pattern

```typescript
import { insertExpenseSchema } from "@shared/schema";

app.post("/api/expenses", isAuthenticated, async (req, res) => {
  const parsed = insertExpenseSchema.safeParse({
    ...req.body,
    userId: req.user.claims.sub
  });
  
  if (!parsed.success) {
    return res.status(400).json({ 
      error: "Invalid data", 
      details: parsed.error.errors 
    });
  }
  
  const expense = await storage.createExpense(parsed.data);
  res.status(201).json(expense);
});
```

### Rate Limiting

```typescript
// server/rateLimit.ts
import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,
  message: { error: "Too many requests" }
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.claims?.sub || req.ip,
  message: { error: "AI rate limit exceeded" }
});
```

---

## Frontend Development

### Adding UI Components (shadcn)

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

### Query Pattern

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['expenses'],
  queryFn: () => fetch('/api/expenses').then(r => r.json())
});

// Mutate data
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (expense) => fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense)
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  }
});
```

### Form Pattern

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertExpenseSchema } from '@shared/schema';

const form = useForm({
  resolver: zodResolver(insertExpenseSchema),
  defaultValues: { amount: 0, merchant: '', currency: 'PHP' }
});
```

---

## Testing

### Setup

```bash
npm install -D vitest @vitest/coverage-v8 supertest @types/supertest
```

### Running Tests

```bash
# Run tests
npm test

# With coverage
npm run test:coverage
```

---

## Deployment

### Environment Variables (Production)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `SESSION_SECRET` | ⚠️ | Session encryption (auto-generated if missing) |
| `NODE_ENV` | ⚠️ | Set to `production` |

### Build and Deploy

```bash
# Build
npm run build

# Start production server
NODE_ENV=production node dist/index.cjs
```

### Replit Deployment

The project is configured for Replit with:
- `.replit` configuration file
- Replit Auth integration
- PostgreSQL addon support

---

## Troubleshooting

### Common Issues

**Database connection failed**
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**OpenAI rate limit**
- AI endpoints limited to 5 req/min per user
- Check `OPENAI_API_KEY` is valid

**Build failures**
```bash
# Clear caches
rm -rf node_modules dist
npm install
npm run build
```

**Type errors**
```bash
# Run type check
npm run check
```

---

## Contributing

1. Create feature branch from `main`
2. Follow existing code patterns
3. Add tests for new features
4. Update documentation
5. Submit PR with description

---

*[Back to Documentation Index](index.md)*
