# Interview Questions & Answers

> **How to use**: Start with MUST KNOW sections. Use SHOULD KNOW to fill gaps. NICE TO KNOW for senior roles.
>
> **Quick nav**: [JavaScript](#javascript) • [TypeScript](#typescript) • [React](#react) • [Next.js](#nextjs) • [State](#state-management) • [Backend](#backend--node) • [Security](#security--auth) • [Performance](#performance) • [System Design](#system-design)

---

## Priority Legend

| Symbol | Priority         | Study Time                  |
| ------ | ---------------- | --------------------------- |
| 🔴     | **MUST KNOW**    | First - interview guarantee |
| 🟡     | **SHOULD KNOW**  | Second - very common        |
| 🟢     | **NICE TO KNOW** | Third - senior level        |

---

# JavaScript

## 🔴 MUST KNOW

### Q: What is the difference between `var`, `let`, and `const`?

**Answer:** `var` is function-scoped and hoisted; `let` and `const` are block-scoped. `const` cannot be reassigned, but both prevent hoisting issues that `var` has. `let` is for values that change.

**💡 Remember:** `const` = constant reference, not constant value. Objects can still be mutated.

---

### Q: What is closure? Give an example.

**Answer:** A closure is when a function "remembers" variables from its outer scope even after that outer function has finished executing.

```javascript
function counter() {
  let count = 0; // This is "closed over"
  return () => ++count;
}

const increment = counter();
increment(); // 1
increment(); // 2
```

**💡 Remember:** Functions remember their lexical scope - that's closure.

---

### Q: How does `this` work in JavaScript?

**Answer:** `this` depends on HOW a function is called:

| Rule           | Example      | `this` value                    |
| -------------- | ------------ | ------------------------------- |
| Regular call   | `fn()`       | Global (or undefined in strict) |
| Object method  | `obj.fn()`   | The object (`obj`)              |
| Arrow function | `() => fn()` | `this` of enclosing scope       |
| `new` keyword  | `new Fn()`   | New instance                    |

```javascript
const obj = {
  name: "test",
  regular() { console.log(this.name); },
  arrow = () => console.log(this.name),
};
```

**💡 Remember:** Arrow functions don't have their own `this`.

---

### Q: What is the Event Loop?

**Answer:** JavaScript is single-threaded. The event loop continuously checks if the call stack is empty, then moves callbacks from the task queue to the stack.

```
Call Stack → Check Queue → Execute
     ↑           ↑
     └───────────┘
         (when stack empty)
```

Order of execution: **Sync code → Microtasks (Promises) → Macrotasks (setTimeout, setInterval)**

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
// Output: 1, 4, 3, 2
```

**💡 Remember:** Promises are microtasks, setTimeout is a macrotask.

---

### Q: What is the difference between `==` and `===`?

**Answer:** `===` checks both value AND type (strict equality). `==` coerces types before comparison (loose equality).

```javascript
0 == false; // true (coerced to 0 === 0)
0 === false; // false (different types)
null == undefined; // true
null === undefined; // false
```

**💡 Remember:** Always use `===` unless you explicitly want type coercion.

---

### Q: What is hoisting?

**Answer:** Hoisting moves variable and function declarations to the top of their scope before execution.

```javascript
console.log(x); // undefined (not error)
var x = 5;

// Equivalent to:
var x; // hoisted, undefined
console.log(x);
var x = 5;
```

**💡 Remember:** `let` and `const` are hoisted but in a "temporal dead zone" - they exist but can't be accessed before declaration.

---

## 🟡 SHOULD KNOW

### Q: What is the difference between `null` and `undefined`?

**Answer:** `undefined` means a variable exists but has no value assigned. `null` is an intentional empty value assignment.

```javascript
let a; // undefined - no value
let b = null; // null - explicitly empty
```

**💡 Remember:** `typeof null` returns `'object'` - a famous JavaScript bug.

---

### Q: What is the prototype chain?

**Answer:** Objects in JavaScript have a `[[Prototype]]` link to another object. When accessing a property, JavaScript walks up this chain until it finds it or reaches `null`.

```javascript
const arr = [1, 2, 3];
arr.hasOwnProperty("push"); // false
arr.__proto__.hasOwnProperty("push"); // true
Array.prototype.hasOwnProperty("push"); // true
```

**💡 Remember:** Class extends = prototype chain under the hood.

---

### Q: What is debounce vs throttle?

**Answer:** Both limit function execution frequency. Debounce waits for silence (stops calling until N ms pass). Throttle calls at most once per N ms.

```javascript
// Debounce - waits until user stops typing
window.addEventListener("resize", debounce(handleResize, 300));

// Throttle - calls at most every 100ms
window.addEventListener("scroll", throttle(handleScroll, 100));
```

**💡 Remember:** Debounce for search input, throttle for scroll/resize.

---

### Q: What is event delegation? Why use it?

**Answer:** Instead of adding listeners to each child, add ONE listener to the parent. Events bubble up, so you catch them at the parent.

```javascript
// Instead of adding click to each <li>
document.querySelector("ul").addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    console.log("Clicked:", e.target.textContent);
  }
});
```

**💡 Remember:** Good for dynamic lists and reducing memory usage.

---

### Q: What are Promises? What is the difference between Promise.all vs Promise.race?

**Answer:** A Promise represents an async operation that may complete or fail.

- `Promise.all`: Waits for ALL promises, fails fast if ANY fails
- `Promise.race`: Resolves/rejects with the FIRST one to complete

```javascript
const [a, b] = await Promise.all([fetchA(), fetchB()]);
const first = await Promise.race([fastReq(), slowReq()]);
```

**💡 Remember:** `Promise.allSettled` - waits for all, reports all results (never fails fast).

---

### Q: What is async/await? How does it compare to Promises?

**Answer:** `async/await` is syntactic sugar over Promises - makes async code look synchronous. `await` pauses execution within the async function, not the whole program.

```javascript
// Promise chain
fetchUser(id)
  .then((user) => fetchPosts(user.id))
  .then((posts) => console.log(posts));

// async/await (cleaner)
const user = await fetchUser(id);
const posts = await fetchPosts(user.id);
```

**💡 Remember:** `async` always returns a Promise. `await` only works inside `async` functions.

---

## 🟢 NICE TO KNOW

### Q: What is the difference between `for...in` and `for...of`?

**Answer:** `for...in` iterates over object KEYS. `for...of` iterates over array VALUES (or any iterable).

```javascript
const arr = ["a", "b"];
for (const i in arr) {
  console.log(i);
} // 0, 1 (keys)
for (const v of arr) {
  console.log(v);
} // a, b (values)
```

---

### Q: What are Symbol and BigInt?

**Answer:** `Symbol()` creates unique, immutable identifiers. `BigInt` handles integers larger than `Number.MAX_SAFE_INTEGER`.

```javascript
const id = Symbol("id");
const huge = 9007199254740991n; // BigInt
```

---

### Q: What is a WeakMap and when would you use it?

**Answer:** A WeakMap holds references that won't prevent garbage collection. Keys must be objects. Useful for memoization where you don't want to leak memory.

---

# TypeScript

## 🔴 MUST KNOW

### Q: What is the difference between `interface` and `type`?

**Answer:** Both define object shapes. `interface` can be extended/implemented and has better error messages. `type` is more flexible (unions, intersections, primitives).

```typescript
interface User {
  name: string;
}
type Status = "active" | "inactive";
type Admin = User & { role: "admin" };
```

**💡 Remember:** Use `interface` for object shapes others may implement. Use `type` for complex unions.

---

### Q: What are Generics? Give an example.

**Answer:** Generics let you write reusable code that works with any type while maintaining type safety.

```typescript
function identity<T>(arg: T): T {
  return arg;
}

const result = identity<string>("hello"); // T = string
const num = identity(42); // T = number (inferred)
```

**💡 Remember:** `<T>` means "this function uses a type called T".

---

### Q: What is the difference between `any`, `unknown`, and `never`?

**Answer:**

- `any`: Opts out of type checking (unsafe)
- `unknown`: Any value, but must narrow before use (safe any)
- `never`: Impossible type (function never returns, always throws)

```typescript
function fail(msg: string): never {
  throw new Error(msg);
}

let val: unknown = "hello";
if (typeof val === "string") {
  console.log(val.toUpperCase()); // safe - narrowed
}
```

**💡 Remember:** `unknown` is `any` with safety. `never` is "this can never happen".

---

### Q: What are Union and Intersection types?

**Answer:** Union (`|`) means "either type". Intersection (`&`) means "combined types".

```typescript
type A = { name: string } | { age: number }; // either
type B = { name: string } & { age: number }; // both (has name AND age)
```

**💡 Remember:** Union = OR, Intersection = AND.

---

### Q: What are utility types? Name a few.

**Answer:** Built-in TypeScript types that transform other types.

```typescript
Partial<T>; // All properties optional
Required<T>; // All properties required
Pick<T, "name">; // Select properties
Omit<T, "id">; // Remove properties
Record<K, V>; // Key-value object
Readonly<T>; // Immutable
```

**💡 Remember:** `Partial` = `?` on all fields. `Omit` = remove a field.

---

## 🟡 SHOULD KNOW

### Q: What are Type Guards? Give an example.

**Answer:** Narrow down a union type to a more specific type.

```typescript
function isUser(obj: User | Admin): obj is User {
  return "email" in obj;
}

// Usage
if (isUser(entity)) {
  entity.email; // TypeScript knows it's User
}
```

**💡 Remember:** `obj is Type` is the return type pattern for type predicates.

---

### Q: What is type inference?

**Answer:** TypeScript automatically figures out types when not explicitly specified.

```typescript
let x = 5; // x is inferred as number
const y = "hello"; // y is inferred as "hello" (literal)
```

**💡 Remember:** You don't always need to annotate - let TypeScript infer when clear.

---

### Q: What are Generic Constraints?

**Answer:** Limit what types can be used with generics.

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

getProperty({ name: "John" }, "name"); // string
getProperty({ name: "John" }, "id"); // Error!
```

**💡 Remember:** `extends keyof` means "must be a valid key".

---

## 🟢 NICE TO KNOW

### Q: What is the `infer` keyword?

**Answer:** Extract a type from another type within a conditional type.

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

**💡 Remember:** `infer R` means "capture whatever this resolves to".

---

### Q: What are discriminated unions?

**Answer:** A union where each member has a common literal property (discriminant) that TypeScript uses to narrow.

```typescript
type Action =
  | { type: "increment"; amount: number }
  | { type: "decrement"; amount: number };

function reducer(action: Action) {
  switch (action.type) {
    case "increment":
      return action.amount; // amount is available
  }
}
```

**💡 Remember:** The `type` field tells TypeScript which branch you're in.

---

# React

## 🔴 MUST KNOW

### Q: What is the difference between state and props?

**Answer:** Props are inputs passed from parent to child (immutable). State is data managed within a component (mutable). Props trigger re-renders; state changes cause re-renders.

**💡 Remember:** Props = configuration from outside. State = internal memory.

---

### Q: When does React re-render a component?

**Answer:** A component re-renders when:

1. Its state changes (`setState`)
2. Its props change
3. Parent re-renders (children re-render too by default)

**💡 Remember:** State change = re-render. Parent re-render = children re-render.

---

### Q: What is the difference between `useState` and `useRef`?

**Answer:** `useState` triggers re-renders when changed. `useRef` persists a value without causing re-renders. `useRef` also gives direct DOM access.

```typescript
const [count, setCount] = useState(0); // triggers re-render
const countRef = useRef(0); // doesn't trigger re-render
countRef.current++; // just updates the value
```

**💡 Remember:** State for UI updates. Ref for DOM or non-UI values.

---

### Q: How does `useEffect` work? What is the dependency array?

**Answer:** `useEffect` runs AFTER render. The dependency array controls when it re-runs:

- No array: runs every render
- Empty array `[]`: runs once (on mount)
- `[dep]`: runs when `dep` changes

```typescript
useEffect(() => {
  // Runs after render
  return () => {}; // Cleanup function (runs before next effect or unmount)
}, [dependency]);
```

**💡 Remember:** Effects run AFTER render, not during. Cleanup prevents memory leaks.

---

### Q: What is the cleanup function in useEffect?

**Answer:** Return a function from useEffect that runs before the next effect or on unmount. Used to cancel subscriptions, clear timers, remove event listeners.

```typescript
useEffect(() => {
  const timer = setInterval(() => setCount((c) => c + 1), 1000);
  return () => clearInterval(timer); // Clean up on unmount
}, []);
```

**💡 Remember:** Always cleanup subscriptions that could pile up.

---

### Q: Controlled vs Uncontrolled components?

**Answer:** Controlled: React manages the input value via state. Uncontrolled: DOM manages it, you use `ref` to access values.

```typescript
// Controlled (React state)
<input value={name} onChange={e => setName(e.target.value)} />

// Uncontrolled (DOM state)
<input ref={inputRef} />
const value = inputRef.current.value;
```

**💡 Remember:** Controlled = React owns the value. Uncontrolled = DOM owns it.

---

### Q: Why do we need keys in lists?

**Answer:** Keys help React identify which items changed, were added, or removed. This makes reconciliation efficient and prevents bugs.

```tsx
{
  items.map((item) => (
    <li key={item.id}>{item.name}</li> // Use stable ID, not index!
  ));
}
```

**💡 Remember:** Keys = stable unique IDs. Index as key = bugs when list changes.

---

### Q: What is React.memo? When to use it?

**Answer:** `React.memo` memoizes a component - it only re-renders if props change. Use for expensive components or pure components that render often with same props.

```tsx
const ExpensiveList = React.memo(({ items }) => {
  return items.map((item) => <div key={item.id}>{item.name}</div>);
});
```

**💡 Remember:** Memoize expensive renders. Don't over-memoize simple components.

---

## 🟡 SHOULD KNOW

### Q: What is the difference between `useCallback` and `useMemo`?

**Answer:** `useMemo` memoizes a computed VALUE. `useCallback` memoizes a function REFERENCE (prevents new function creation on every render).

```typescript
const memoizedValue = useMemo(() => expensiveCalc(a, b), [a, b]);
const memoizedFn = useCallback(() => doSomething(a), [a]);
```

**💡 Remember:** `useCallback(fn, deps)` = `useMemo(() => fn, deps)`.

---

### Q: What is the Virtual DOM?

**Answer:** A lightweight JavaScript representation of the real DOM. React compares (diffs) the virtual DOM before and after changes to calculate minimal updates needed.

```
State Change → New Virtual DOM → Diff → Minimal Real DOM Updates
```

**💡 Remember:** Virtual DOM = staging area. Reconciliation = diffing algorithm.

---

### Q: What is reconciliation?

**Answer:** React's algorithm to diff the new virtual DOM with the previous one to determine minimal updates needed for the real DOM.

**💡 Remember:** Reconciliation = diffing. Keys make it efficient.

---

### Q: What are custom hooks?

**Answer:** Functions starting with `use` that extract and reuse stateful logic. They can use other hooks.

```typescript
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const handler = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return size;
}
```

**💡 Remember:** Custom hooks = extracting logic, not UI.

---

### Q: What is `forwardRef`?

**Answer:** Allows a parent component to pass a ref to a child component's DOM element or class component.

```tsx
const Input = forwardRef((props, ref) => <input ref={ref} {...props} />);

// Parent can now access input ref directly
<Input ref={inputRef} />;
```

**💡 Remember:** `forwardRef` exposes DOM node to parent.

---

### Q: What is Error Boundary?

**Answer:** A React component that catches JavaScript errors in its children and displays a fallback UI instead of crashing.

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    logError(error, info);
  }

  render() {
    if (this.state.hasError) return <h1>Something went wrong</h1>;
    return this.props.children;
  }
}
```

**💡 Remember:** Error boundaries catch React errors, not:

- Event handlers
- Async code
- Server-side rendering

---

## 🟢 NICE TO KNOW

### Q: What is React Portal?

**Answer:** Render children into a different DOM node (outside parent hierarchy). Useful for modals, tooltips.

```tsx
const Modal = ({ children }) => {
  return ReactDOM.createPortal(children, document.getElementById("modal-root"));
};
```

---

### Q: What is the difference between `createElement`, `cloneElement`, and `React.Children`?

**Answer:**

- `createElement`: Creates a React element
- `cloneElement`: Clones and merges props into existing element
- `React.Children`: Utilities for traversing `props.children`

**💡 Remember:** Rarely used directly in modern React (JSX handles createElement).

---

### Q: What is `useLayoutEffect`?

**Answer:** Same as `useEffect` but SYNCHRONOUSLY after DOM mutations. Use for measuring DOM elements (like tooltips).

```tsx
useLayoutEffect(() => {
  const rect = elementRef.current.getBoundingClientRect();
  // Measure synchronously before paint
}, []);
```

**💡 Remember:** `useLayoutEffect` = before paint. `useEffect` = after paint.

---

# Next.js

## 🔴 MUST KNOW

### Q: What is the difference between Server Components and Client Components?

**Answer:** Server Components (default in App Router) run on the server, can access DB/files, no client-side JS. Client Components (`"use client"`) run on client, can use hooks/state/events.

```tsx
// Server Component (default) - no "use client"
export default async function Page() {
  const users = await db.getUsers(); // Direct DB access!
  return <UserList users={users} />;
}

// Client Component - interactive
("use client");
export default function Form() {
  const [name, setName] = useState("");
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

**💡 Remember:** Server = DB, async, no hooks. Client = hooks, events, interactivity.

---

### Q: What is middleware/proxy in Next.js?

**Answer:** Code that runs before a request is completed. Used for authentication, logging, redirects. In Next.js 16, `middleware.ts` was renamed to `proxy.ts`.

```typescript
// src/proxy.ts (Next.js 16)
import { auth } from "@/lib/auth";

export default auth(function proxy(req) {
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});
```

**💡 Remember:** Proxy runs before render - great for auth checks.

---

### Q: What is SSR, SSG, ISR, and CSR?

**Answer:**

- **SSR**: Server renders on each request (dynamic)
- **SSG**: Static generation at build time (fast, cached)
- **ISR**: Incremental static regeneration (hybrid - revalidate)
- **CSR**: Client renders in browser (dynamic, SEO issues)

```
SSR  → Every request → Dynamic content
SSG  → Build time → Static, fastest
ISR  → Background revalidate → Fresh-ish static
CSR  → Browser → API calls, SEO problems
```

**💡 Remember:** SSG for static content. SSR for personalized/dynamic. ISR for "mostly static".

---

### Q: How do API Routes work in Next.js?

**Answer:** Create REST endpoints in `src/app/api/` by exporting named functions (GET, POST, PUT, DELETE).

```typescript
// src/app/api/users/route.ts
export async function GET(request: Request) {
  const session = await auth();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ success: true, data: users });
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ success: true });
}
```

**💡 Remember:** API Routes = your backend API. No separate Express needed.

---

### Q: When to use `auth()` from NextAuth vs manually checking sessions?

**Answer:** Use `auth()` (or `getServerSession`) in Server Components/Route Handlers for session data. Use `useSession` hook in Client Components.

```typescript
// Server Component
const session = await auth();
if (!session) redirect("/login");

// Client Component
const { data: session } = useSession();
```

**💡 Remember:** Server = `auth()`, Client = `useSession()`.

---

## 🟡 SHOULD KNOW

### Q: What is the difference between `getServerSideProps` and `getStaticProps`?

**Answer:** `getServerSideProps` runs on EVERY request (SSR). `getStaticProps` runs at build time, pages are cached (SSG).

```typescript
// SSR - runs every request
export async function getServerSideProps() {
  return { props: { data: await fetchData() } };
}

// SSG - runs at build
export async function getStaticProps() {
  return { props: { data: await fetchData() } };
}
```

**💡 Remember:** In App Router, use `async` Server Components directly instead.

---

### Q: What is the Next.js Image component and why use it?

**Answer:** `<Image>` optimizes images automatically - lazy loading, format conversion (WebP), sizing to prevent layout shift, caching.

```tsx
import Image from "next/image";

<Image src="/photo.jpg" alt="Description" width={400} height={300} />;
```

**💡 Remember:** Always use Next.js Image - handles WebP, lazy load, CLS prevention.

---

### Q: What is the Metadata API?

**Answer:** Define metadata (title, description, og tags) in layout or page files for SEO.

```tsx
export const metadata = {
  title: "Page Title",
  description: "Page description",
  openGraph: { title: "OG Title", images: ["/image.jpg"] },
};
```

**💡 Remember:** Metadata = SEO. Put in `layout.tsx` for global, `page.tsx` for specific.

---

## 🟢 NICE TO KNOW

### Q: What are Route Groups?

**Answer:** Folders in `app/` wrapped in `(parentheses)` don't affect the URL. Used to organize routes without adding to path.

```
app/
  (auth)/login/page.tsx    → /login
  (auth)/register/page.tsx → /register
  dashboard/page.tsx      → /dashboard
```

**💡 Remember:** `(auth)` is just for grouping - URL doesn't include it.

---

### Q: What is Parallel Routes?

**Answer:** Multiple routes rendered simultaneously in the same layout using tabs.

```tsx
app/
  @modal/(.)photo/[id]/page.tsx   → /photo/:id
  layout.tsx → <Tabs><slot name="modal" /></Tabs>
```

**💡 Remember:** Parallel = multiple slots in same layout. Intercepting = show modal for same URL.

---

# State Management

## 🔴 MUST KNOW

### Q: Zustand vs Context - when to use which?

**Answer:** Context is built-in but causes re-renders of all consumers. Zustand is lightweight, doesn't require providers, and only re-renders subscribers.

```typescript
// Zustand - simple, no provider
const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// Usage - just call the hook
const { user } = useStore();
```

**💡 Remember:** Zustand = simple global state without Context's re-render problems.

---

### Q: React Query vs Redux - when to use which?

**Answer:** React Query for **server state** (fetching, caching, syncing). Redux for **complex client state** (forms, UI state). Most apps need both.

| Aspect      | React Query    | Redux          |
| ----------- | -------------- | -------------- |
| Purpose     | Server state   | Client state   |
| Caching     | Built-in       | Manual         |
| Boilerplate | Low            | High           |
| DevTools    | Query devtools | Redux devtools |

**💡 Remember:** Server state = React Query. Complex UI state = Redux (or Zustand).

---

### Q: What is optimistic update?

**Answer:** Update UI immediately before server confirms, rollback if server fails. Makes apps feel instant.

```typescript
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries(["todos"]);
    const previous = queryClient.getQueryData(["todos"]);
    queryClient.setQueryData(["todos"], (old) => [...old, newTodo]);
    return { previous };
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(["todos"], context.previous); // rollback
  },
});
```

**💡 Remember:** Optimistic = update now, confirm later, rollback on fail.

---

## 🟡 SHOULD KNOW

### Q: What is React Query's stale-while-revalidate?

**Answer:** Serve stale data while fetching fresh data in background. User sees data immediately (stale), then UI updates when fresh data arrives.

```typescript
useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  staleTime: 1000 * 60, // Consider fresh for 1 minute
});
```

**💡 Remember:** `staleTime` = how long data is considered fresh. `gcTime` = how long unused data stays in cache.

---

### Q: When to lift state up vs use context/zustand?

**Answer:** Lifting state up for shared state between 2-3 components. Context/Zustand for deeply nested components or app-wide state.

**💡 Remember:** Lift up for co-located siblings. Global store for deeply nested or many consumers.

---

# Backend / Node.js

## 🔴 MUST KNOW

### Q: What is the middleware pattern?

**Answer:** Chain of functions where each processes the request, then passes to next. Express uses this pattern.

```javascript
// Middleware chain
app.use(logger); // 1. Log
app.use(auth); // 2. Authenticate
app.use(validate); // 3. Validate
app.get("/data", handler); // 4. Final handler
```

**💡 Remember:** Middleware = processing chain. Call `next()` to continue, or `res.send()` to stop.

---

### Q: How do you handle errors in Express?

**Answer:** Use try/catch in async handlers, error-handling middleware at the end.

```javascript
// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Error middleware (4 params)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});
```

**💡 Remember:** Error middleware has 4 params: `err, req, res, next`.

---

### Q: What is the difference between authentication and authorization?

**Answer:** Authentication = "who are you?" (login). Authorization = "what can you do?" (permissions/roles).

**💡 Remember:** Authn = verify identity. Authz = verify permissions.

---

## 🟡 SHOULD KNOW

### Q: What is ORM? What are the advantages/disadvantages?

**Answer:** ORM maps database tables to objects. Advantages: type safety, abstraction, migrations. Disadvantages: query flexibility, performance for complex queries.

| ORM (Prisma, Drizzle) | Raw SQL                    |
| --------------------- | -------------------------- |
| Type safety           | Full flexibility           |
| Migrations built-in   | Better for complex queries |
| Easier reads/writes   | Performance for analytics  |

**💡 Remember:** Use ORM for typical CRUD. Raw SQL for complex reporting.

---

### Q: REST API best practices?

**Answer:**

- Use proper HTTP methods (GET/POST/PUT/DELETE)
- Use plural nouns for resources (`/users`, not `/getUsers`)
- Return proper status codes (200, 201, 400, 401, 403, 404, 500)
- Consistent error format

```json
// Error response
{ "success": false, "error": "User not found" }

// Success response
{ "success": true, "data": { "id": 1, "name": "John" } }
```

**💡 Remember:** REST = predictable URLs + HTTP verbs + status codes.

---

### Q: What is rate limiting? Why is it important?

**Answer:** Limit number of requests per user/IP in a time window. Prevents brute force attacks, DDoS, and API abuse.

```typescript
// Redis sliding window rate limit
const requests = await redis.zrangebyscore(key, 0, now - windowMs);
if (requests.length > max) return 429;
await redis.zadd(key, now, `${now}-${uuid()}`);
```

**💡 Remember:** Rate limit = request quota per time window.

---

## 🟢 NICE TO KNOW

### Q: What are streams in Node.js?

**Answer:** Process data piece by piece instead of loading all in memory. Useful for large files or real-time data.

```javascript
// Readable stream
fs.createReadStream("large-file.txt").pipe(csvParser()).pipe(process.stdout);
```

**💡 Remember:** Streams = memory efficient for large data.

---

### Q: What is the difference between process.nextTick and setImmediate?

**Answer:** `process.nextTick` schedules callback at END of current operation, before I/O events. `setImmediate` schedules after I/O events.

```javascript
process.nextTick(() => console.log("nextTick"));
setImmediate(() => console.log("immediate"));
// Output: nextTick, immediate
```

**💡 Remember:** `nextTick` = before I/O. `immediate` = after I/O.

---

# Security / Auth

## 🔴 MUST KNOW

### Q: What is XSS? How do you prevent it?

**Answer:** Cross-Site Scripting - attacker injects malicious scripts. Prevention: sanitize input, use Content Security Policy, escape output.

```tsx
// React escapes by default (preventing XSS)
const userInput = "<script>alert('hack')</script>";
return <div>{userInput}</div>; // Safe - rendered as text

// Danger: dangerouslySetInnerHTML - avoid or sanitize first
```

**💡 Remember:** React escapes content. `dangerouslySetInnerHTML` = danger zone.

---

### Q: What is CSRF? How do you prevent it?

**Answer:** Cross-Site Request Forgery - attacker makes requests on behalf of authenticated user. Prevention: CSRF tokens, SameSite cookies.

```typescript
// SameSite cookie prevents CSRF
response.cookies.set("token", value, {
  httpOnly: true,
  sameSite: "strict", // or 'lax'
});
```

**💡 Remember:** `SameSite=Strict` = no cross-site requests. `SameSite=Lax` = safe except on navigation.

---

### Q: What is the difference between httpOnly and regular cookies?

**Answer:** `httpOnly` cookies cannot be accessed by JavaScript (document.cookie), preventing XSS from stealing tokens. Regular cookies are accessible to JS.

```typescript
// Secure cookie - JS can't read
res.cookie("token", value, { httpOnly: true });

// Regular cookie - accessible to JS (vulnerable to XSS)
res.cookie("theme", "dark"); // document.cookie can read this
```

**💡 Remember:** `httpOnly` = JS can't read = XSS can't steal.

---

### Q: What is JWT? How do you store it securely?

**Answer:** JSON Web Token - signed token containing claims. Store in httpOnly cookie (NOT localStorage). Access token in memory, refresh token in cookie.

| Storage         | XSS Safe | CSRF Safe         |
| --------------- | -------- | ----------------- |
| localStorage    | ❌       | ✅                |
| httpOnly Cookie | ✅       | ❌ (use SameSite) |

**💡 Remember:** JWT in httpOnly cookie = both XSS and CSRF protection.

---

### Q: What is SQL injection? How to prevent?

**Answer:** Attacker inserts malicious SQL. Prevention: parameterized queries/prepared statements (never concatenate user input to SQL).

```typescript
// DANGER - SQL injection possible
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// SAFE - parameterized
db.query("SELECT * FROM users WHERE id = $1", [userId]);
```

**💡 Remember:** Never concatenate user input to SQL. Use parameterized queries.

---

## 🟡 SHOULD KNOW

### Q: What is bcrypt? Why is it good for passwords?

**Answer:** Password hashing algorithm with salt and configurable rounds. Slow to compute, making brute force attacks expensive.

```typescript
const hash = await bcrypt.hash(password, 12); // 12 rounds
const match = await bcrypt.compare(password, hash);
```

**💡 Remember:** bcrypt = slow hash = expensive to brute force.

---

### Q: What is token rotation? Why use it?

**Answer:** On refresh, issue NEW tokens and invalidate OLD ones. Limits token lifetime and detects token theft.

```
1. Login → Access token + Refresh token
2. Access expires → Send refresh token
3. Server validates → Issues NEW access + NEW refresh, invalidates old
```

**💡 Remember:** Rotation = old token becomes useless. Limits exposure window.

---

### Q: What is CORS? How do you configure it?

**Answer:** Cross-Origin Resource Sharing - controls which domains can access your API.

```typescript
// Allow specific origin
app.use(
  cors({
    origin: "https://yourapp.com",
    credentials: true, // Allow cookies
  }),
);

// Production: validate origin, don't use wildcard
```

**💡 Remember:** CORS = who can call your API from browsers.

---

## 🟢 NICE TO KNOW

### Q: What is OAuth 2.0?

**Answer:** Authorization framework allowing third-party access without sharing credentials. Flow: User → Auth Server → Token → Resource.

```
User → Auth Server (login) → Authorization Code → Your Server → Access Token
```

**💡 Remember:** OAuth = delegation, not authentication. Use OpenID Connect (OIDC) for identity.

---

### Q: What is a CSP (Content Security Policy)?

**Answer:** HTTP header controlling which resources can load. Prevents XSS by blocking inline scripts from untrusted sources.

```
Content-Security-Policy: script-src 'self' https://trusted-cdn.com
```

**💡 Remember:** CSP = whitelist of allowed resource sources.

---

# Performance

## 🔴 MUST KNOW

### Q: How do you optimize React re-renders?

**Answer:**

1. `React.memo` for pure components
2. `useMemo` for expensive calculations
3. `useCallback` for stable function references
4. Lift state only when needed
5. Virtualize long lists

```tsx
// Memoize expensive component
const ExpensiveList = React.memo(({ items }) =>
  items.map((item) => <Item key={item.id} {...item} />),
);

// Memoize computed value
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items],
);
```

**💡 Remember:** Memoize at boundary of expensive subtree, not every component.

---

### Q: What is code splitting? How do you do it?

**Answer:** Split bundle into smaller chunks, load on demand. Use `React.lazy` and dynamic imports.

```tsx
const Dashboard = lazy(() => import("./pages/Dashboard"));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>;
```

**💡 Remember:** Code split = load only what user needs, when they need it.

---

### Q: What are Web Vitals?

**Answer:** Metrics measuring user experience. Core Web Vitals:

| Metric | Good    | Measures         |
| ------ | ------- | ---------------- |
| LCP    | < 2.5s  | Load performance |
| FID    | < 100ms | Interactivity    |
| CLS    | < 0.1   | Visual stability |

**💡 Remember:** LCP = when main content loads. FID = how fast responds. CLS = layout shifts.

---

## 🟡 SHOULD KNOW

### Q: What is lazy loading? When to use it?

**Answer:** Defer loading non-critical resources until needed. Use for routes, images below fold, heavy components.

```tsx
// Route-based lazy loading
const Settings = lazy(() => import("./Settings"));

// Image lazy loading
<img loading="lazy" src="/photo.jpg" alt="..." />;
```

**💡 Remember:** Lazy load = load later = faster initial page.

---

### Q: What causes memory leaks in React?

**Answer:**

1. Unsubscribed event listeners
2. Timers not cleared (`setInterval` without `clearInterval`)
3. Global stores subscribing but never unsubscribing

```typescript
useEffect(() => {
  const timer = setInterval(doSomething, 1000);
  return () => clearInterval(timer); // Clean up!
}, []);
```

**💡 Remember:** Every subscription needs cleanup.

---

### Q: What is virtualization (windowing)?

**Answer:** Render only visible items in long lists. Libraries: `react-window`, `react-virtualized`.

```tsx
import { FixedSizeList } from "react-window";

<FixedSizeList height={400} itemCount={10000} itemSize={50}>
  {({ index, style }) => <div style={style}>Row {index}</div>}
</FixedSizeList>;
```

**💡 Remember:** Virtualization = render 20 items instead of 10,000.

---

# System Design

## 🔴 MUST KNOW

### Q: How would you design a data fetching strategy?

**Answer:** Hybrid approach based on data freshness requirements:

| Strategy     | When to Use                  | Example         |
| ------------ | ---------------------------- | --------------- |
| SSG + ISR    | Mostly static, need fresh    | Blog posts      |
| SSR          | Highly dynamic, personalized | User dashboard  |
| Client fetch | User-initiated updates       | Search results  |
| React Query  | Server state management      | Cached API data |

**💡 Remember:** SSG for speed, SSR for dynamic, React Query for sync.

---

### Q: How do you structure a large React application?

**Answer:** Feature-based folder structure:

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
│   └── users/
│       ├── components/
│       ├── hooks/
│       └── api/
├── shared/
│   ├── components/
│   └── utils/
└── app/
```

**💡 Remember:** Feature-based > type-based. Colocate related files.

---

### Q: How do you handle errors in a React app?

**Answer:** Multiple layers:

1. **Component level**: Try/catch with fallback UI
2. **Error Boundaries**: Catch React errors, show fallback
3. **API layer**: Handle HTTP errors, return consistent format
4. **Global**: Error reporting service (Sentry)

```tsx
<ErrorBoundary>
  <Suspense fallback={<Loading />}>
    <Dashboard />
  </Suspense>
</ErrorBoundary>
```

**💡 Remember:** Layer your error handling. Don't let errors go silent.

---

## 🟡 SHOULD KNOW

### Q: How do you design a secure authentication system?

**Answer:**

1. Passwords: bcrypt (12 rounds), never store plain text
2. Sessions: JWT in httpOnly cookie or server sessions
3. Refresh tokens: Rotation + revocation capability
4. Rate limiting: Prevent brute force
5. HTTPS: Always use TLS

```
Login → Hash password → Compare → Create session token
                                      ↓
                              Store in httpOnly cookie
```

**💡 Remember:** httpOnly + SameSite + HTTPS + bcrypt = secure auth.

---

### Q: What caching strategies exist?

**Answer:**

- **Cache-aside**: App checks cache, then DB (React Query default)
- **Write-through**: Write to cache and DB simultaneously
- **Write-behind**: Write to cache, async write to DB
- **TTL**: Time-based expiration

**💡 Remember:** Cache-aside = read-heavy. Write-through = consistency.

---

## 🟢 NICE TO KNOW

### Q: How do you scale a React app for performance?

**Answer:**

1. Code splitting by route
2. Lazy load heavy components
3. Virtualize long lists
4. Optimize images (WebP, responsive)
5. Bundle analysis + tree shaking
6. CDN for static assets
7. Proper caching headers

**💡 Remember:** Measure first (Lighthouse, Web Vitals), then optimize.

---

# Quick Reference Cheat Sheet

## React Hooks Priority

```
MUST掌握:  useState, useEffect, useCallback, useMemo, useRef
SHOULD:    useContext, useReducer, useLayoutEffect
NICE:      useImperativeHandle, useDebugValue
```

## State Management Decision Tree

```
Need server data?
├─ Yes → React Query / SWR
└─ No → Need global UI state?
         ├─ Yes → Zustand / Redux
         └─ No → Lift state up
```

## Security Checklist

```
✅ bcrypt for passwords
✅ httpOnly + SameSite cookies
✅ Parameterized SQL queries
✅ Input validation (Zod)
✅ Rate limiting
✅ HTTPS in production
✅ CORS configured
✅ CSP header
✅ XSS prevention (escape output)
```

---

# Questions to Ask Interviewer

Good questions show you're thoughtful:

1. "What's the biggest technical challenge you're facing right now?"
2. "How do you handle code reviews and technical decisions?"
3. "What's the balance between features and tech debt?"
4. "How do you onboard new engineers?"
5. "What's the testing strategy?"
