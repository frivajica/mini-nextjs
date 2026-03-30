# Next.js Learning Guide

> **How to use**: Read the Quick Reference first. Then study each topic. Use Interview Questions to test yourself.

---

## Quick Reference

### Core Topics (Study in Order)

| #   | Topic                          | Key Concept                      | File                 |
| --- | ------------------------------ | -------------------------------- | -------------------- |
| 1   | [App Router](#1-app-router)    | Server Components by default     | `src/app/`           |
| 2   | [API Routes](#2-api-routes)    | REST endpoints in `src/app/api/` | `src/app/api/`       |
| 3   | [NextAuth](#3-auth)            | JWT + httpOnly cookies           | `src/lib/auth.ts`    |
| 4   | [Middleware](#4-middleware)    | Route protection                 | `src/middleware.ts`  |
| 5   | [Zustand](#5-state)            | Global UI state                  | `src/stores/`        |
| 6   | [React Query](#6-server-state) | Server state                     | `src/hooks/`         |
| 7   | [Drizzle](#7-database)         | Type-safe SQL                    | `src/lib/schema.ts`  |
| 8   | [Redis](#8-redis)              | Token caching + rate limiting    | `src/lib/redis.ts`   |
| 9   | [Forms](#9-forms)              | React Hook Form + Zod            | `src/components/ui/` |

### CLI Commands

```bash
yarn dev          # Start development
yarn build        # Production build
yarn db:push     # Push schema to DB
yarn db:studio    # Open DB browser
```

---

## 1. App Router

**Key Idea**: Components are **Server by default**. Add `"use client"` only when needed.

```typescript
// Server Component (default) - can use async/await, db
export default async function Page() {
  const users = await db.select().from(users);
  return <UserList users={users} />;
}

// Client Component - use hooks, events
"use client";
export default function Form() {
  const [name, setName] = useState("");
  return <input value={name} onChange={e => setName(e.target.value)} />;
}
```

### When to Use

| Feature             | Server | Client |
| ------------------- | ------ | ------ |
| Database queries    | ✅     | ❌     |
| async/await         | ✅     | ❌     |
| useState, useEffect | ❌     | ✅     |
| Event handlers      | ❌     | ✅     |
| NextAuth            | ✅     | ✅     |

---

## 2. API Routes

**Key Idea**: Create REST endpoints by exporting named functions.

```typescript
// src/app/api/users/route.ts
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ success: true, data: users });
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ success: true });
}
```

### HTTP Methods

| Method | Use for         |
| ------ | --------------- |
| GET    | Fetch data      |
| POST   | Create resource |
| PATCH  | Update resource |
| DELETE | Delete resource |

---

## 3. Auth (NextAuth)

**Key Idea**: Two tokens - JWT for sessions, refresh token in httpOnly cookie for rotation.

```
Login → JWT cookie (NextAuth) + Refresh token (httpOnly cookie)
Refresh → Validate old, create new, revoke old (atomic)
Logout → Clear cookie, revoke token
```

### Configuration

```typescript
// src/lib/auth.ts
export const { handlers, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const user = await validateUser(
          credentials.email,
          credentials.password,
        );
        return user
          ? { id: user.id, email: user.email, role: user.role }
          : null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
```

### Auth Flow

```
1. Login → POST /api/auth/login → Set httpOnly cookie
2. Access protected route → NextAuth reads JWT cookie
3. Token expires → POST /api/auth/refresh → Rotate tokens
4. Logout → POST /api/auth/logout → Clear cookie + revoke
```

---

## 4. Middleware

**Key Idea**: Protect routes BEFORE they render. NextAuth provides `auth()` middleware.

```typescript
// src/middleware.ts
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");

  if (!isAuthPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
```

---

## 5. State: Zustand

**Key Idea**: Simple global state. No providers needed.

```typescript
// src/stores/auth.store.ts
interface AuthState {
  user: User | null;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  logout: async () => {
    set({ isLoggingOut: true });
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null, isLoggingOut: false });
  },
})));
```

### Usage

```typescript
const { user, logout } = useAuthStore();
```

### When to Use

| State Type                 | Tool                          |
| -------------------------- | ----------------------------- |
| Global UI (auth, theme)    | Zustand                       |
| Server data (users, posts) | React Query                   |
| Form state                 | Local state / React Hook Form |

---

## 6. Server State: React Query

**Key Idea**: Cache server data. Handles loading, errors, refetching.

```typescript
// src/hooks/use-users.ts
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
  });
}
```

### Usage

```typescript
const { data: users = [], isLoading, error } = useUsers();
```

---

## 7. Database (Drizzle)

**Key Idea**: Type-safe SQL. Define schema, write queries.

```typescript
// Schema: src/lib/schema.ts
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).default("USER").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Query
const allUsers = await db.select().from(users);
const user = await db.query.users.findFirst({ where: eq(users.email, email) });
```

---

## 8. Redis

**Key Idea**: Cache refresh tokens for fast validation + rate limiting.

### Token Caching

```typescript
// Cache on create
await redis.setex(`refresh:${token}`, 7 * 24 * 60 * 60, userId);

// Check cache first
const cached = await redis.get(`refresh:${token}`);
if (cached) return getUserById(parseInt(cached));
```

### Rate Limiting

```typescript
// Sliding window rate limit
const multi = redis.multi();
multi.zremrangebyscore(key, 0, windowStart);
multi.zadd(key, now, `${now}-${crypto.randomUUID()}`);
multi.zcard(key);
const count = await multi.exec();
```

---

## 9. Forms

**Key Idea**: React Hook Form for form state + Zod for validation.

```typescript
// Validation schema
const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
});

// In component
const form = useForm({ resolver: zodResolver(schema) });
form.handleSubmit((data) => {
  /* valid data */
});
```

### FormField Component

```typescript
<FormField label="Email" error={form.formState.errors.email}>
  <Input {...form.register("email")} />
</FormField>
```

---

## Directory Structure

```
src/
├── app/                    # App Router
│   ├── (auth)/           # Login, register pages
│   ├── (dashboard)/      # Protected pages
│   ├── api/
│   │   ├── auth/         # login, register, refresh, logout
│   │   └── users/        # CRUD
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home
├── components/ui/         # Button, Input, Form, Card
├── hooks/                 # useUsers, useDeleteUser
├── lib/                   # auth, db, redis, env
├── services/              # Business logic
├── stores/                # Zustand stores
└── types/                # TypeScript types
```

---

## Interview Questions

### Must Know

1. **Server vs Client Components**: Server for DB/async, Client for hooks/events
2. **Middleware**: Protects routes before rendering, uses NextAuth `auth()`
3. **NextAuth Flow**: JWT cookie + httpOnly refresh token cookie
4. **Zustand vs React Query**: UI state vs server state

### Should Know

1. **API Routes**: REST endpoints with GET/POST/PATCH/DELETE
2. **Form Validation**: React Hook Form + Zod resolver
3. **Rate Limiting**: Redis sorted sets with sliding window

---

## Security Checklist

| Feature          | Implementation                |
| ---------------- | ----------------------------- |
| Passwords        | bcrypt (12 rounds)            |
| Sessions         | JWT in HTTPOnly cookie        |
| Refresh Tokens   | httpOnly cookie + Redis cache |
| Rate Limiting    | Redis sliding window          |
| Input Validation | Zod schemas                   |
| Trust Proxy      | Validate x-forwarded-for      |
