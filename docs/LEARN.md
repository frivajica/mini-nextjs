# Next.js Learning Guide

> ⭐ = Must know for production apps  
> 🔧 = Important for specific scenarios  
> 📚 = Good to understand

This project is a production-ready Next.js API with frontend. Use this guide to learn Next.js by comparing with Express and NestJS.

---

## Quick Reference

| Priority | Topic                        | Section                               |
| -------- | ---------------------------- | ------------------------------------- |
| ⭐       | Project Structure            | [1](#1-project-structure)             |
| ⭐       | App Router                   | [2](#2-app-router)                    |
| ⭐       | API Routes                   | [3](#3-api-routes)                    |
| ⭐       | Authentication (NextAuth)    | [4](#4-authentication-nextauth)       |
| ⭐       | Zustand State Management     | [5](#5-zustand-state-management)      |
| ⭐       | Server vs Client Components  | [6](#6-server-vs-client-components)   |
| ⭐       | Middleware                   | [7](#7-middleware)                    |
| ⭐       | Database & Drizzle           | [8](#8-database--drizzle)             |
| ⭐       | Redis Caching                | [9](#9-redis-caching)                 |
| ⭐       | Form Handling                | [10](#10-form-handling)               |
| 🔧       | Docker Setup                 | [11](#11-docker-setup)                |
| 🔧       | Security Best Practices      | [12](#12-security-best-practices)     |
| 📚       | Next.js vs NestJS vs Express | [13](#13-nextjs-vs-nestjs-vs-express) |

---

## 1. Project Structure ⭐

### Files to Review

- [src/app/layout.tsx](../src/app/layout.tsx) - Root layout
- [src/app/page.tsx](../src/app/page.tsx) - Home page
- [src/lib/auth.ts](../src/lib/auth.ts) - NextAuth config
- [src/lib/db.ts](../src/lib/db.ts) - Database client
- [src/lib/redis.ts](../src/lib/redis.ts) - Redis client

### Directory Layout

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth group (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Protected routes
│   │   ├── users/
│   │   └── settings/
│   ├── api/                # API Routes
│   │   ├── auth/
│   │   └── users/
│   ├── layout.tsx
│   └── page.tsx
├── components/ui/          # Base components
├── lib/                     # Core libraries
├── stores/                  # Zustand stores
├── services/                # Business logic
└── types/                   # TypeScript types
```

### Route Groups

- `(auth)` - Public routes without layout
- `(dashboard)` - Protected routes with dashboard layout

---

## 2. App Router ⭐

### Key Concepts

Next.js 13+ uses the **App Router** with React Server Components.

```typescript
// src/app/page.tsx - Server Component (default)
export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/users");
  } else {
    redirect("/login");
  }
}
```

### Layouts

```typescript
// src/app/layout.tsx - Root layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Key Differences from Pages Router

| Feature       | App Router        | Pages Router       |
| ------------- | ----------------- | ------------------ |
| Components    | Server by default | Client by default  |
| Layouts       | Nested layouts    | \_app.js           |
| Data Fetching | async/await       | getServerSideProps |
| API Routes    | Route Handlers    | Pages              |

---

## 3. API Routes ⭐

### Files to Review

- [src/app/api/auth/route.ts](../src/app/api/auth/route.ts)
- [src/app/api/users/route.ts](../src/app/api/users/route.ts)

### Route Handlers

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Handle request
  return NextResponse.json({ success: true, data: users });
}
```

### HTTP Methods

| Method    | Export                                    | Purpose         |
| --------- | ----------------------------------------- | --------------- |
| GET       | `export async function GET()`             | Fetch data      |
| POST      | `export async function POST()`            | Create resource |
| PUT/PATCH | `export async function PUT()` / `PATCH()` | Update resource |
| DELETE    | `export async function DELETE()`          | Delete resource |

### Why API Routes over Server Actions?

For this project, we chose **API Routes** because:

- More explicit control over HTTP
- Easier to test with external tools (curl, Postman)
- Better debugging experience
- Industry standard REST pattern

Server Actions are better for:

- Form submissions with progressive enhancement
- Mutating data from Server Components
- Simpler mutations without HTTP overhead

---

## 4. Authentication (NextAuth) ⭐

### Files to Review

- [src/lib/auth.ts](../src/lib/auth.ts)
- [src/app/api/auth/[...nextauth]/route.ts](../src/app/api/auth/[...nextauth]/route.ts)
- [src/stores/auth.store.ts](../src/stores/auth.store.ts)
- [docs/AUTH_INFO.md](./AUTH_INFO.md)

### Configuration

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        // Validate credentials
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
```

### Protected Routes Pattern

```typescript
// src/app/(dashboard)/layout.tsx
"use client";

export default function DashboardLayout({ children }) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return <Loading />;

  return <>{children}</>;
}
```

### NextAuth vs Custom JWT

| Feature            | NextAuth          | Custom JWT |
| ------------------ | ----------------- | ---------- |
| Session Management | Built-in          | Manual     |
| Providers          | Multiple built-in | Manual     |
| Token Refresh      | Automatic         | Manual     |
| Database Adapters  | Many built-in     | Manual     |
| Complexity         | Higher            | Lower      |

---

## 5. Zustand State Management ⭐

### Files to Review

- [src/stores/auth.store.ts](../src/stores/auth.store.ts)

### Why Zustand?

- **Minimal boilerplate** - No providers or contexts needed
- **DevTools support** - Built-in Redux DevTools support
- **TypeScript** - First-class TS support
- **Performance** - Selector-based subscriptions

### Simple Store Pattern

```typescript
// src/stores/auth.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  refreshToken: string | null;
  setUser: (user: User) => void;
  setRefreshToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      refreshToken: null,
      setUser: (user) => set({ user }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      clearAuth: () => set({ user: null, refreshToken: null }),
    }),
    { name: "auth-storage" },
  ),
);
```

### Usage in Components

```typescript
// In a component
"use client";
import { useAuthStore } from "@/stores/auth.store";

export function Profile() {
  const { user, setUser } = useAuthStore();

  return <div>{user?.name}</div>;
}
```

### When to Use Zustand vs React Query

| Scenario                      | Use         |
| ----------------------------- | ----------- |
| Global UI state (auth, theme) | Zustand     |
| Server state (users, data)    | React Query |
| Form state                    | Local state |

---

## 6. Server vs Client Components ⭐

### Server Components (Default in App Router)

```typescript
// src/app/page.tsx - Server Component
export default async function Home() {
  // Can do direct DB queries
  const users = await db.select().from(usersTable);

  return <UserList users={users} />;
}
```

### Client Components ("use client")

```typescript
// src/app/users/page.tsx - Client Component
"use client";

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  return <UserList users={users} />;
}
```

### When to Use Which

| Feature            | Server | Client |
| ------------------ | ------ | ------ |
| Database queries   | ✅     | ❌     |
| DOM manipulation   | ❌     | ✅     |
| useState/useEffect | ❌     | ✅     |
| NextAuth session   | ✅     | ✅     |
| Route params       | ✅     | ✅     |

---

## 7. Middleware ⭐

### Files to Review

- [src/middleware.ts](../src/middleware.ts) (if created)

### Basic Middleware Pattern

```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for auth token
  const token = request.cookies.get("auth-token");

  if (!token && request.nextUrl.pathname.startsWith("/users")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/users/:path*", "/settings/:path*"],
};
```

---

## 8. Database & Drizzle ⭐

### Files to Review

- [src/lib/schema.ts](../src/lib/schema.ts)
- [src/lib/db.ts](../src/lib/db.ts)
- [drizzle.config.ts](../drizzle.config.ts)

### Schema Definition

```typescript
// src/lib/schema.ts
import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("USER").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Database Client

```typescript
// src/lib/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });
```

### Drizzle Commands

```bash
yarn db:generate   # Generate migrations
yarn db:migrate    # Run migrations
yarn db:push       # Push schema to DB
yarn db:studio     # Open Drizzle Studio
```

---

## 9. Redis Caching ⭐

### Files to Review

- [src/lib/redis.ts](../src/lib/redis.ts)
- [src/services/user.service.ts](../src/services/user.service.ts)

### Redis Client

```typescript
// src/lib/redis.ts
import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!);
```

### Usage in Service

```typescript
// src/services/user.service.ts
export async function validateRefreshToken(token: string) {
  // Check Redis cache first
  const cachedUserId = await redis.get(`refresh:${token}`);

  if (cachedUserId) {
    return getUserById(parseInt(cachedUserId));
  }

  // Fallback to DB
  const storedToken = await db.query.refreshTokens.findFirst({...});

  if (storedToken) {
    // Cache for next time
    await redis.setex(`refresh:${token}`, 7 * 24 * 60 * 60, userId);
  }

  return user;
}
```

---

## 10. Form Handling ⭐

### Files to Review

- [src/components/ui/form.tsx](../src/components/ui/form.tsx)
- [src/app/(auth)/login/page.tsx](<../src/app/(auth)/login/page.tsx>)

### Simple Form Component

```typescript
// src/components/ui/form.tsx
"use client";

function Form({ children, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      {children}
    </form>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label>{label}</label>
      {children}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Usage with Zod Validation

```typescript
// src/app/(auth)/login/page.tsx
"use client";

export default function LoginPage() {
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    // Submit form
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormField label="Email" error={errors.email}>
        <Input name="email" type="email" />
      </FormField>
      <FormButton type="submit">Sign In</FormButton>
    </Form>
  );
}
```

---

## 11. Docker Setup 🔧

### Files to Review

- [Dockerfile](../Dockerfile)
- [docker-compose.yml](../docker-compose.yml)

### Services

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mini_nextjs
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Commands

```bash
docker-compose up -d           # Start services
docker-compose down            # Stop services
docker-compose ps              # Check status
docker exec -it postgres psql -U user -d mini_nextjs  # DB shell
```

---

## 12. Security Best Practices 🔧

### Rate Limiting

```typescript
// In API routes
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 10;

function rateLimit(ip: string) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  return record.count < MAX_REQUESTS;
}
```

### Input Validation

```typescript
// Always validate with Zod
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

### Password Hashing

```typescript
import bcrypt from "bcrypt";

const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hash);
```

---

## 13. Next.js vs NestJS vs Express 📚

### Architecture Comparison

| Aspect    | Express | NestJS        | Next.js        |
| --------- | ------- | ------------- | -------------- |
| Framework | Minimal | Full-featured | Full-stack     |
| Frontend  | None    | None          | Built-in React |
| API Style | Routes  | Controllers   | Route Handlers |
| DI System | Manual  | Built-in      | N/A            |
| Modules   | Manual  | Built-in      | N/A            |

### Authentication Comparison

| Feature        | Express    | NestJS      | Next.js          |
| -------------- | ---------- | ----------- | ---------------- |
| Auth           | Custom JWT | Passport.js | NextAuth.js      |
| Sessions       | In-memory  | DB          | NextAuth + Redis |
| Token Rotation | DB-based   | DB-based    | Redis-based      |

### Learning Path

1. **Start with**: `src/app/page.tsx` - Entry point
2. **Then**: `src/app/(auth)/login/page.tsx` - Auth flow
3. **Then**: `src/app/api/auth/route.ts` - API routes
4. **Then**: `src/lib/auth.ts` - NextAuth configuration
5. **Then**: `src/stores/auth.store.ts` - State management

### Why Different Approaches?

- **Express**: Pure backend, manual everything, maximum control
- **NestJS**: Backend with structure, decorators, modules
- **Next.js**: Full-stack, React frontend + API, opinionated

---

## Interview Questions

### ⭐ High Priority

1. Explain Next.js App Router vs Pages Router
2. When would you use Server Components vs Client Components?
3. How does NextAuth.js handle authentication?
4. Why use Zustand for state management?

### 🔧 Medium Priority

1. How do you protect routes in Next.js?
2. Explain the difference between API Routes and Server Actions
3. How do you handle forms with validation in Next.js?

### 📚 Good to Understand

1. How does Drizzle ORM compare to Prisma?
2. When would you choose Express over Next.js?
3. How do you optimize Next.js for production?
