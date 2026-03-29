# Code Audit Report

**Project**: mini-nextjs-test  
**Date**: 2026-03-29  
**Auditor**: Claude Code

---

## Executive Summary

The codebase is well-structured overall with good patterns (React Hook Form + Zod, Zustand store, Drizzle ORM). However, several issues ranging from dead code to architectural concerns were identified.

---

## 1. Dead Code / Unused Code

### Critical
| File | Issue |
|------|-------|
| `src/stores/auth.store.ts:11` | `logout` function defined but `handleLogout` in layout doesn't use it |
| `src/app/(dashboard)/layout.tsx:23` | `logout` imported but `handleLogout` is a custom duplicate |
| `src/services/user.service.ts:7` | `NewUser` imported but never used |
| `src/lib/schema.ts:8` | `primaryKey` imported but never used |

### Details
```typescript
// auth.store.ts - logout exists but isn't used
logout: async () => { ... }

// layout.tsx - custom handleLogout instead of using store's logout
const { user, refreshToken, logout, clearAuth } = useAuthStore();
// ...
const handleLogout = async () => {  // <-- duplicates store.logout
  await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout", refreshToken }) });
  clearAuth();
  router.push("/login");
}
```

---

## 2. Duplicate Code

### Critical
| Issue | Files Affected |
|-------|---------------|
| `setUser` mapping from API response | `login/page.tsx`, `register/page.tsx` |
| Error handling pattern | `login/page.tsx`, `register/page.tsx`, `settings/page.tsx` |
| `handleLogout` duplication | `stores/auth.store.ts`, `app/(dashboard)/layout.tsx` |

### Details
```typescript
// Login and Register have identical user mapping:
setUser({
  id: json.data.user.id,
  email: json.data.user.email,
  name: json.data.user.name,
  role: json.data.user.role as "USER" | "ADMIN",
});
```

**Fix**: Create a shared `mapApiUserToSession` utility function.

---

## 3. Type Inconsistencies

### High
| File | Issue |
|------|-------|
| `src/types/index.ts:14` | `SanitizedUser.role` is `string`, should be `UserRole` |
| `src/types/index.ts:4` | `SessionUser.id` is `number`, but NextAuth JWT uses `string` |
| `login/register/pages` | `id` from API is DB integer, but `SessionUser.id` is `number` - this works but is confusing |

### Details
```typescript
// SanitizedUser uses string for role
export interface SanitizedUser {
  role: string;  // Should be UserRole
}

// But SessionUser uses UserRole
export interface SessionUser {
  role: UserRole;  // "USER" | "ADMIN"
}
```

---

## 4. Component Duplication

### High
| Issue | Files |
|-------|-------|
| Two different `Input` components | `src/components/ui/form.tsx`, `src/components/ui/input.tsx` |
| Two different `Label` components | `src/components/ui/form.tsx`, `src/components/ui/label.tsx` |
| `form.tsx` exports its own `Input` but pages import from both | `input.tsx` and `form.tsx` |

### Details
```typescript
// form.tsx exports Input
const Input = React.forwardRef<...>(...);
export { Form, Label, FormField, FormButton, Input };

// input.tsx also exports Input
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = React.forwardRef<...>(...);
export { Input };
```

**Pages import Input from form.tsx but also have `import { Input } from "@/components/ui/input"` unused.**

---

## 5. Settings Page Issues

### High
```typescript
// settings/page.tsx:24 - Local schema instead of centralized
const settingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});
```

**Should be in `types/auth.ts` alongside other schemas.**

### Critical
```typescript
// settings/page.tsx:42-50 - Mock implementation, doesn't actually save
const onSubmit = async (data: SettingsInput) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));  // Fake delay
    setSuccessMessage("Settings saved successfully");
  } catch {
    // ...
  }
};
```

**This should call an API endpoint to update user settings.**

---

## 6. Error Handling Inconsistencies

### Medium
| Pattern | Files | Issue |
|---------|-------|-------|
| `alert()` | `users/page.tsx:65,68` | Bad UX, blocks UI |
| `form.setError("root", ...)` | login, register, settings | Good pattern |
| `successMessage` state | settings page | Good but inconsistent |

### Details
```typescript
// users/page.tsx - Bad: blocks the main thread
alert(json.error);
alert("Failed to delete user");

// Should use toast notifications or inline error states
```

---

## 7. Architecture Issues

### High

#### 7.1 Mixed Concerns in Auth Route
```typescript
// auth/route.ts handles ALL of these:
- register
- login
- refresh
- logout
```
**Should be split into separate route handlers or use a proper action pattern.**

#### 7.2 Repeated Auth Checks
```typescript
// Every API route repeats this pattern:
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```
**Should use Next.js middleware for route protection.**

#### 7.3 In-Memory Rate Limiting
```typescript
// auth/route.ts:14
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
```
**Won't work across multiple serverless instances. Should use Redis.**

#### 7.4 Store + Session Redundancy
```typescript
// Zustand store persists user + refreshToken
// But NextAuth also manages session via JWT
```
**Two sources of truth for auth state.**

---

## 8. Security Considerations

### Medium
| Issue | Location |
|-------|----------|
| No CSRF protection visible | All mutations |
| Error messages might leak internals | `auth/route.ts:160` |
| No input sanitization beyond Zod | API routes |

### Details
```typescript
// auth/route.ts - Error could leak stack traces
console.error("Auth error:", error);  // Logs full error
return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
```

---

## 9. Unused Dependencies

### Low
| Package | Reason |
|---------|--------|
| `@auth/drizzle-adapter` | Using JWT strategy, not sessions |
| `uuid` | `crypto.randomUUID()` is built-in |
| `sessions` table | Not used with JWT strategy |

### Details
```typescript
// user.service.ts:5
import { v4 as uuidv4 } from "uuid";  // Could use crypto.randomUUID()

// package.json
"@auth/drizzle-adapter": "^1.11.1",  // Not used
```

---

## 10. Schema Issues

### Medium
```typescript
// schema.ts - Password varchar(255) but bcrypt is always 60 chars
password: varchar("password", { length: 255 }).notNull(),
```
**Consider using `text` or `varchar(60)` for clarity.**

---

## Summary by Severity

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 8 |
| Medium | 6 |
| Low | 4 |

### Critical Issues
1. Settings form doesn't actually save (mock implementation)
2. Dead code (`logout` in store never used)
3. Component duplication causing confusion
4. Duplicate `handleLogout` implementation

### High Priority
1. Type inconsistency (`SanitizedUser.role` vs `SessionUser.role`)
2. Settings schema not centralized
3. In-memory rate limiting won't work serverless
4. Repeated auth checks across API routes
5. Mixed concerns in auth route

---

## Recommendations

1. **Immediate**: Fix settings form to call real API
2. **High**: Centralize schemas in `types/auth.ts`
3. **High**: Create shared auth utilities
4. **High**: Use Next.js middleware for auth
5. **Medium**: Replace `alert()` with toast notifications
6. **Medium**: Consolidate component exports
7. **Low**: Remove unused imports/dependencies
