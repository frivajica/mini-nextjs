# Study Guide: AI-Native Frontend Engineering Interview

> **Purpose**: Ace this interview by mastering what's in "The Builder We Need" while covering other essentials.
>
> **Time estimate**: ~2.5 hours total. Prioritize 🔴 sections first.
>
> **Quick nav**:
> [Performance](#1-60fps--browser-rendering) •
> [React Performance](#2-react-performance) •
> [Animation](#3-animation-transitions) •
> [TypeScript](#4-typescript-mastery) •
> [Async UI](#5-async-ui--streaming) •
> [AI State](#6-state-for-ai-uis) •
> [Media](#7-heavy-media--virtualization) •
> [SEO](#8-seo) •
> [AI Patterns](#9-ai-native-interfaces) •
> [System Design](#10-system-design) •
> [Interview Q&A](#11-interview-qa) •
> [Cheat Sheet](#12-cheat-sheet)

---

# 🔴 CRITICAL SECTIONS

---

## 1. 60fps & Browser Rendering

**What it is**: Understanding how browsers turn code into pixels on screen.

### The Rendering Pipeline

```
JavaScript → Style → Layout → Paint → Composite
    ↑           ↑        ↑        ↑         ↑
  (JS runs)  (CSS)   (reflow)  (fill)   (layers)
```

| Stage       | Expensive?     | What Happens              |
| ----------- | -------------- | ------------------------- |
| JavaScript  | Yes            | Execute code              |
| Style (CSS) | Moderate       | Calculate styles          |
| Layout      | Most expensive | Calculate positions/sizes |
| Paint       | Moderate       | Fill pixels               |
| Composite   | Cheap          | Layer stacking            |

**Key insight**: Avoid Layout (reflow) and Paint. Target Composite-only animations.

### How to Extract 60fps

```javascript
// BAD: Triggers Layout + Paint every frame
element.style.left = x + "px"; // Layout!
element.style.top = y + "px"; // Layout!

// GOOD: Only Composite (GPU accelerated)
element.style.transform = `translate(${x}px, ${y}px)`; // Composite only!
```

### CSS Properties by Performance Cost

| Costly (Trigger Layout)          | Cheap (Composite Only) |
| -------------------------------- | ---------------------- |
| `width`, `height`                | `transform`            |
| `top`, `left`, `right`, `bottom` | `opacity`              |
| `margin`, `padding`              | `filter` (some)        |
| `border`                         | `will-change`          |
| `font-size`                      | `backdrop-filter`      |

### will-change Hint

```css
/* Tell browser to promote to own layer */
.animated-element {
  will-change: transform, opacity;
}
```

**💡 Remember**: `transform` + `opacity` = GPU compositing = 60fps. Moving `left/top` = CPU reflow = jank.

### Layout Thrashing (Avoid)

```javascript
// BAD: Read then write in loop - forces many layouts
for (let i = 0; i < elements.length; i++) {
  const height = elements[i].offsetHeight; // READ - forces layout
  elements[i].style.height = height + "px"; // WRITE - triggers layout
}

// GOOD: Batch reads, then batch writes
const heights = elements.map((el) => el.offsetHeight); // READ all
heights.forEach((h, i) => (elements[i].style.height = h + "px")); // WRITE all
```

### 📚 Resources

- [Google Web Fundamentals: Rendering Performance](https://developers.google.com/web/fundamentals/performance/rendering)
- [MDN: CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/contain)

---

## 2. React Performance

### When React Re-renders

A component re-renders when:

1. **State changes** (`setState`)
2. **Props change** (parent re-renders)
3. **Context changes** (if subscribed)

### Memoization Strategy

```typescript
// 1. React.memo - memoize COMPONENT (prevents re-render if props same)
const ExpensiveList = React.memo(({ items }) => {
  return items.map(item => <Item key={item.id} {...item} />);
});

// 2. useMemo - memoize VALUE (expensive calculation)
const sortedItems = useMemo(
  () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// 3. useCallback - memoize FUNCTION REFERENCE (prevents child re-renders)
const handleClick = useCallback((id: number) => {
  doSomething(id);
}, [doSomething]);

// DON'T over-memoize - measure first!
```

### Virtual DOM & Reconciliation

```
State Change → New Virtual DOM → Diff Algorithm → Minimal Real DOM Updates
```

React compares (diffs) new virtual DOM with previous to calculate **minimal updates**.

**Keys make diffing efficient** - stable IDs, not index:

```tsx
// BAD: Index as key - causes bugs when list order changes
{
  items.map((item, index) => <li key={index}>{item.name}</li>);
}

// GOOD: Stable unique ID
{
  items.map((item) => <li key={item.id}>{item.name}</li>);
}
```

### Code Splitting

```typescript
// Split bundle - load only when needed
const HeavyDashboard = lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<LoadingSkeleton />}>
  <HeavyDashboard />
</Suspense>
```

### Virtualization (for Long Lists)

Render only visible items:

```tsx
import { FixedSizeList } from "react-window";

<FixedSizeList height={400} itemCount={10000} itemSize={50}>
  {({ index, style }) => <div style={style}>Row {index}</div>}
</FixedSizeList>;
// Renders ~20 items instead of 10,000!
```

### Performance Checklist

```
✅ Memoize expensive child components with React.memo
✅ Memoize computed values with useMemo
✅ Memoize callbacks passed to children with useCallback
✅ Use virtualization for long lists (react-window)
✅ Code split with lazy() + Suspense
✅ Avoid inline objects/arrays as props (causes re-render)
✅ Lift state only when needed
✅ Use React DevTools Profiler to find bottlenecks
```

### 📚 Resources

- [React Docs: Reconciliation](https://react.dev/learn/preserving-and-resetting-state)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)

---

## 3. Animation & Transitions

**What it is**: Creating smooth, physics-based animations that feel natural.

### CSS Transitions

```css
/* For simple state changes */
.button {
  transition:
    transform 200ms ease-out,
    background-color 150ms ease;
}

.button:hover {
  transform: scale(1.05);
  background-color: #ff6b6b;
}
```

### CSS Animations (Keyframes)

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeIn 300ms ease-out forwards;
}
```

### JavaScript: requestAnimationFrame

```javascript
// For complex, frame-by-frame animations
function animate(element, from, to, duration) {
  const start = performance.now();

  function step(timestamp) {
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = easeOutQuad(progress); // Easing function

    element.style.transform = `translateX(${from + (to - from) * eased}px)`;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function easeOutQuad(t) {
  return t * (2 - t);
}
```

### Spring Physics (Natural Motion)

```javascript
// Spring animation for "juicy" feel
function spring(current, target, velocity, stiffness = 180, damping = 12) {
  const force = -stiffness * (current - target);
  const newVelocity = velocity + force * 0.001; // Damping
  const newPosition = current + newVelocity * 0.016; // ~60fps

  return { position: newPosition, velocity: newVelocity };
}
```

### Layout Animation Tips

```css
/* Animate layout changes smoothly */
.accordion-content {
  transition:
    height 300ms ease,
    opacity 200ms ease;
  overflow: hidden;
}

/* Use transform instead of height for performance */
.list-item {
  transition: transform 200ms ease;
}
```

### will-change for Animations

```css
.animated-element {
  will-change: transform, opacity;
  /* Tells browser: "this will change, prep GPU layer" */
}
```

### FLIP Technique (Animate Layout Changes)

```javascript
// First, Last, Invert, Play
function animateSort() {
  // First: Record initial positions
  const first = items.map((item) => item.getBoundingClientRect());

  // Make changes (sort, move items)
  sortItems();

  // Last: Record final positions
  const last = items.map((item) => item.getBoundingClientRect());

  // Invert: Calculate delta, apply inverse transform
  items.forEach((item, i) => {
    const delta = first[i].left - last[i].left;
    item.style.transform = `translateX(${delta}px)`;
    item.style.transition = "none";

    // Play: Animate to final position
    requestAnimationFrame(() => {
      item.style.transition = "transform 300ms ease";
      item.style.transform = "translateX(0)";
    });
  });
}
```

### 📚 Resources

- [Google: Animation Performance](https://developers.google.com/web/fundamentals/performance/rendering)
- [Rachel Nabors: Animation Guide](https://rachelnabors.com/animation-guide/)
- [Spring Physics for the Web](https://medium.com/@rachelnabors/falling-for-spring-physics-17cs1442be85)

---

## 4. TypeScript Mastery

### interface vs type

```typescript
// interface: Use when others may implement/extend
interface User {
  name: string;
  email: string;
}

// type: Use for unions, intersections, primitives
type Status = "active" | "inactive";
type Admin = User & { role: "admin" };
type MaybeUser = User | null;
```

### Generics

```typescript
// Generic function
function identity<T>(arg: T): T {
  return arg;
}

// Generic constraints
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

getProperty({ name: "John" }, "name"); // OK
getProperty({ name: "John" }, "age"); // Error!

// Generic with interface
interface ApiResponse<T> {
  data: T;
  status: number;
  error?: string;
}
```

### unknown vs any vs never

```typescript
// any: Opts out of type checking (AVOID)
function dangerous(input: any) {
  return input.foo.bar; // No error! Dangerous!
}

// unknown: Must narrow before use (SAFE any)
function safe(input: unknown) {
  if (typeof input === "string") {
    console.log(input.toUpperCase()); // OK - narrowed
  }
}

// never: Impossible type
function fail(msg: string): never {
  throw new Error(msg);
}
```

### Type Guards & Narrowing

```typescript
// Custom type guard
function isUser(obj: unknown): obj is User {
  return typeof obj === "object" && obj !== null && "email" in obj;
}

// Discriminated unions (exhaustive checking)
type Action =
  | { type: "increment"; amount: number }
  | { type: "decrement"; amount: number }
  | { type: "reset" };

function reducer(action: Action) {
  switch (action.type) {
    case "increment":
      return action.amount; // amount available
    case "decrement":
      return action.amount;
    case "reset":
      return 0;
    default:
      action; // never - TypeScript knows all cases covered
  }
}
```

### Utility Types

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

Partial<User>; // All optional: { id?: number; name?: string; ... }
Required<User>; // All required
Pick<User, "id" | "name">; // Select: { id: number; name: string }
Omit<User, "id">; // Remove: { name: string; email: string; role: ... }
Readonly<User>; // Immutable
Record<string, User>; // Key-value: { [key: string]: User }
```

### Generic Constraints

```typescript
// Must have certain properties
function create<T extends { name: string }>(obj: T): T {
  return { ...obj, id: generateId() };
}
```

### 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TypeScript Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

# 🟡 HIGH PRIORITY SECTIONS

---

## 5. Async UI & Streaming

**What it is**: Managing the "in-between" states when data is loading.

### Suspense Boundaries

```tsx
// Show fallback while children are loading
<Suspense fallback={<LoadingSkeleton />}>
  <UserProfile userId={id} />
</Suspense>
```

### Streaming with Suspense

```tsx
// Streaming: Send shell immediately, stream content as ready
// page.tsx (Server Component)
export default async function Page() {
  return (
    <div>
      <Header /> {/* Sent immediately */}
      <Suspense fallback={<UserSkeleton />}>
        <UserData /> {/* Streamed when ready */}
      </Suspense>
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments /> {/* Streamed separately */}
      </Suspense>
    </div>
  );
}
```

### Optimistic Updates

Update UI immediately, rollback on failure:

```typescript
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries(["todos"]);

    // Snapshot previous value
    const previous = queryClient.getQueryData(["todos"]);

    // Optimistically update
    queryClient.setQueryData(["todos"], (old: Todo[]) => [...old, newTodo]);

    return { previous }; // Return context for rollback
  },
  onError: (err, newTodo, context) => {
    // Rollback on error
    queryClient.setQueryData(["todos"], context.previous);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries(["todos"]);
  },
});
```

### Pending States (for AI Generation)

```typescript
// Track pending state for streaming AI responses
function useAIStream(prompt: string) {
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">(
    "idle",
  );
  const [tokens, setTokens] = useState("");

  // Streaming logic...
  useEffect(() => {
    if (!prompt) return;
    setStatus("streaming");

    const controller = new AbortController();
    streamTokens(prompt, (token) => {
      setTokens((prev) => prev + token);
    })
      .then(() => setStatus("done"))
      .catch(() => setStatus("error"));

    return () => controller.abort();
  }, [prompt]);

  return { status, tokens, isPending: status === "streaming" };
}
```

### 📚 Resources

- [React Docs: Suspense](https://react.dev/reference/react/Suspense)
- [Tanner Linsley: Optimistic Updates](https://tkdodo.eu/blog/optimistic-updates-and-usemutation)

---

## 6. State for AI UIs

**What it is**: Managing non-deterministic, streaming, error-prone AI states.

### State Machine for AI Generation

```typescript
type GenerationState =
  | { status: 'idle' }
  | { status: 'generating'; progress: number }
  | { status: 'streaming'; output: string }
  | { status: 'done'; output: string }
  | { status: 'error'; message: string };

// Use discriminated union for type safety
function render(state: GenerationState) {
  switch (state.status) {
    case 'idle': return <StartButton />;
    case 'generating': return <ProgressBar progress={state.progress} />;
    case 'streaming': return <StreamingText text={state.output} />;
    case 'done': return <FinalOutput text={state.output} />;
    case 'error': return <ErrorMessage msg={state.message} />;
  }
}
```

### Error Boundaries

```tsx
// Catch React errors - class component only!
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <FallbackUI />;
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <AIGeneratedContent />
</ErrorBoundary>;
```

### AbortController for Cancellation

```typescript
// Allow user to cancel AI generation
function useVideoGenerator(prompt: string) {
  const controllerRef = useRef<AbortController>();

  const start = () => {
    controllerRef.current = new AbortController();

    fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt }),
      signal: controllerRef.current.signal,
    });
  };

  const cancel = () => {
    controllerRef.current?.abort();
  };

  return { start, cancel };
}
```

### 📚 Resources

- [XState (State Machines)](https://xstate.js.org/)
- [React Query: Cancellation](https://tanstack.com/query/latest/docs/react/guides/query-cancellation)

---

## 7. Heavy Media & Virtualization

### Progressive Loading

```tsx
// Low quality placeholder → High quality
const ProgressiveImage = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <img
        src={lowQualitySrc}
        style={{
          filter: loaded ? "none" : "blur(20px)",
          transition: "filter 0.3s",
        }}
      />
      <img
        src={src}
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.3s" }}
      />
    </div>
  );
};
```

### Intersection Observer (Lazy Load)

```typescript
// Load when visible
function useIntersectionObserver(ref: RefObject<Element>) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return isVisible;
}
```

### Image Optimization (Next.js)

```tsx
import Image from "next/image";

<Image
  src="/photo.jpg"
  alt="Description"
  width={400}
  height={300}
  loading="lazy" // Built-in lazy loading
  placeholder="blur" // Blur placeholder
  sizes="(max-width: 768px) 100vw, 50vw"
/>;
```

### Virtualization for Large Lists

```tsx
import { FixedSizeList } from "react-window";

<FixedSizeList height={600} itemCount={10000} itemSize={80}>
  {({ index, style }) => (
    <div style={style}>
      <VideoCard videoId={index} />
    </div>
  )}
</FixedSizeList>;
```

### 📚 Resources

- [react-window](https://github.com/bvaughn/react-window)
- [Next.js Image](https://nextjs.org/docs/app/building-your-application/optimizing/images)

---

## 8. SEO in React/Next.js

### Metadata API

```tsx
// app/layout.tsx (global)
export const metadata = {
  title: "My App",
  description: "App description",
  openGraph: {
    title: "OG Title",
    images: ["/og-image.jpg"],
  },
};

// app/about/page.tsx (specific)
export const metadata = {
  title: "About - My App",
  description: "Learn about us",
};
```

### Server Components for SEO

```tsx
// Server Component: Great for SEO (has full HTML on load)
export default async function ProductPage({ params }) {
  const product = await db.getProduct(params.id);

  return (
    <div>
      <h1>{product.name}</h1> {/* Crawlable! */}
      <p>{product.description}</p>
    </div>
  );
}
```

### Structured Data (JSON-LD)

```tsx
<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Widget",
    image: "https://example.com/widget.jpg",
    description: "A really great widget",
  })}
</script>
```

### SEO Checklist

```
✅ Metadata API for title, description, OG tags
✅ Semantic HTML (h1, main, article, nav)
✅ Server Components for crawlable content
✅ Structured data (JSON-LD)
✅ Descriptive alt text on images
✅ robots.txt, sitemap.xml
✅ Canonical URLs
✅ Core Web Vitals (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1)
```

### 📚 Resources

- [Next.js: Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google: SEO Best Practices](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

---

## 9. AI-Native Interface Patterns

### Streaming Text

```typescript
// Stream tokens as they arrive
async function streamResponse(
  prompt: string,
  onChunk: (token: string) => void,
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    onChunk(chunk);
  }
}
```

### Progress Visualization

```tsx
// Show generation progress
function GenerationProgress({ status, progress, stage }) {
  return (
    <div>
      <div className="progress-bar">
        <div style={{ width: `${progress}%` }} />
      </div>
      <p>Stage: {stage}</p> {/* "Initializing", "Generating", "Finalizing" */}
      {status === "streaming" && <CursorBlink />}
    </div>
  );
}
```

### Model "Thinking" Visualization

```typescript
// Show intermediate steps
type ThoughtStep = {
  action: string;
  timestamp: number;
};

function useModelThoughts() {
  const [thoughts, setThoughts] = useState<ThoughtStep[]>([]);

  // Receive thought updates via SSE or polling
  useEffect(() => {
    const events = new EventSource("/api/thoughts");
    events.onmessage = (e) => {
      setThoughts((prev) => [...prev, JSON.parse(e.data)]);
    };
    return () => events.close();
  }, []);

  return thoughts;
}
```

### 📚 Resources

- [MDN: Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
- [AI UX Patterns](https://まま)

---

## 10. System Design for AI Products

### Component Architecture

```
src/
├── features/
│   ├── video-generation/
│   │   ├── components/       # UI (Player, Controls, Preview)
│   │   ├── hooks/           # useGeneration, useStream
│   │   ├── services/        # API calls, AbortController
│   │   └── types/           # GenerationState, Progress
│   └── chat/
│       ├── components/       # MessageList, Input, TypingIndicator
│       ├── hooks/           # useChat, useStream
│       └── services/
├── shared/
│   ├── components/          # Button, Card, Spinner
│   ├── hooks/               # useIntersectionObserver
│   └── utils/               # cn(), formatTime
```

### Separation: AI Logic vs UI

```typescript
// AI Logic layer (testable, pure)
function generateVideo(prompt: string, signal: AbortSignal): AsyncGenerator<Progress> {
  // Pure AI logic, no UI concerns
  yield { stage: 'initializing', progress: 0 };
  yield { stage: 'generating', progress: 50 };
  yield { stage: 'finalizing', progress: 100 };
}

// UI layer (React)
function VideoGenerator({ prompt }) {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const stream = generateVideo(prompt, controller.signal);

    for await (const update of stream) {
      setProgress(update);
    }

    return () => controller.abort();
  }, [prompt]);

  return <ProgressBar {...progress} />;
}
```

### Data Fetching for AI

```typescript
// React Query for caching AI responses
const useAIResponse = (prompt: string) => {
  return useQuery({
    queryKey: ["ai", prompt],
    queryFn: () => fetchAI(prompt),
    staleTime: 1000 * 60 * 5, // Cache for 5 min
    gcTime: 1000 * 60 * 30, // Keep in cache 30 min
  });
};

// SWR for real-time streaming
const useStreamAI = (prompt: string) => {
  const { data, error, isLoading } = useSWR(
    prompt ? `/api/ai?prompt=${prompt}` : null,
    fetchWithStream,
  );
  return { data, error, isLoading };
};
```

### Caching Strategy

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │───▶│   CDN/Edge   │───▶│  Database   │
│   (Memory)  │    │   (Vercel)   │    │ (Postgres)  │
└─────────────┘    └─────────────┘    └─────────────┘
     │                   │                   │
     │ SWR/React Query   │ Cache-Control     │ Redis
     │ (client cache)    │ (static assets)   │ (session)
```

### Abort/Cancel Patterns

```typescript
// Global abort controller for coordinated cancellation
const generationController = new AbortController();

async function cancelAll() {
  generationController.abort();
}

// Or per-request
const [isGenerating, setIsGenerating] = useState(false);

const generate = async (prompt: string) => {
  const controller = new AbortController();
  setIsGenerating(true);

  try {
    await streamVideo(prompt, controller.signal);
  } catch (e) {
    if (e.name === "AbortError") {
      console.log("Cancelled by user");
    }
  } finally {
    setIsGenerating(false);
  }
};
```

### 📚 Resources

- [Tanner Linsley: React Query Patterns](https://tanstack.com/query/latest/docs/react/guides/important-rules)
- [System Design: Designing AI Applications](https://future.com/ai-application-architecture/)

---

# 🟢 BONUS SECTION

---

## 11. Interview Q&A for This Role

### Q: How would you handle a video generation UI that takes 30+ seconds?

**A**: Show immediate feedback with progress stages, use optimistic updates, implement cancellation, stream partial results.

```tsx
// Show progress, allow cancel
<VideoGenerator prompt={prompt}>
  {({ progress, stage, cancel }) => (
    <>
      <ProgressBar progress={progress} label={stage} />
      <CancelButton onClick={cancel} />
    </>
  )}
</VideoGenerator>
```

### Q: How do you make AI responses feel "magical" but not deceptive?

**A**: Be transparent about loading states, show intermediate steps, don't show final results until complete, have clear error handling.

### Q: Describe your animation philosophy.

**A**: Motion should communicate state changes, feel physics-based (not linear), serve purpose (guide attention), not distract.

### Q: How would you visualize a multimodal model's "thought process"?

**A**: Show sequential steps with visual hierarchy, use streaming text for reasoning, show confidence levels, allow user to expand details.

### Q: Design a component that handles: idle, loading, streaming, done, error states.

**A**: Use discriminated union state machine:

```typescript
type State = Idle | Loading | Streaming | Done | Error;
```

### Q: How do you prevent layout thrash during animations?

**A**: Use `transform` and `opacity` (composite only), batch DOM reads/writes, use `will-change` sparingly, avoid animating layout properties.

### Q: What's your approach to 0-to-1 product development?

**A**: Start with core user flow, validate with real users early, build incrementally, don't over-engineer, prioritize what's visible to user.

---

# 📌 REFERENCE: CHEAT SHEET

## React Hooks by Priority

```
🔴 MUST:    useState, useEffect, useCallback, useMemo, useRef
🟡 SHOULD:  useContext, useReducer, useLayoutEffect, useTransition
🟢 NICE:    useImperativeHandle, useDebugValue, useDeferredValue
```

## State Management Decision Tree

```
Need server data?
├─ Yes → React Query / SWR
└─ No → Need global UI state?
         ├─ Yes → Zustand / Redux
         └─ No → Lift state up
```

## Performance Checklist

```
✅ transform/opacity for animations (not left/top)
✅ React.memo for expensive pure components
✅ useMemo for expensive calculations
✅ useCallback for callback props
✅ Virtualization for long lists
✅ Code splitting with lazy + Suspense
✅ will-change for elements that animate
✅ Batch DOM reads/writes
✅ Avoid inline objects as props
✅ Profile with React DevTools
```

## Animation Cheat Sheet

```css
/* Cheap properties (composite only) */
transform: translate(), scale(), rotate(), skew()
opacity

/* Expensive (trigger layout/paint) */
width, height, top, left, margin, padding, border

/* Timing functions */
ease-out: decelerate (good for entrances)
ease-in-out: symmetric (good for toggles)
spring physics: natural feel (mass, stiffness, damping)
```

## TypeScript Quick Ref

```typescript
// Utility types
Partial<T>     // All optional
Pick<T, 'a' | 'b'>  // Select keys
Omit<T, 'id'>       // Remove keys
Readonly<T>   // Immutable

// Type guards
obj is Type    // Custom guard
typeof x === 'string'  // Primitive
x instanceof Array     // Class

// Discriminated unions
type State = { type: 'a'; a: A } | { type: 'b'; b: B };
```

## CSS Containment

```css
.card {
  contain: layout style paint; /* Isolate from rest of page */
  contain: content; /* Just the children */
}
```

## Web Vitals

| Metric | Good    | Needs Improvement | Poor    | Measures                  |
| ------ | ------- | ----------------- | ------- | ------------------------- |
| LCP    | ≤ 2.5s  | 2.5s - 4.0s       | > 4.0s  | Largest Contentful Paint  |
| INP    | ≤ 200ms | 200ms - 500ms     | > 500ms | Interaction to Next Paint |
| CLS    | ≤ 0.1   | 0.1 - 0.25        | > 0.25  | Cumulative Layout Shift   |

**Note**: FID is deprecated. **INP** (Interaction to Next Paint) replaced it as the Core Web Vital for responsiveness.

## SEO Checklist

```
✅ Metadata API (title, description, OG)
✅ Semantic HTML
✅ Server Components for crawlable content
✅ JSON-LD structured data
✅ Alt text on images
✅ Core Web Vitals in green
```

---

# 📚 All Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Google Web Fundamentals](https://developers.google.com/web/fundamentals)
- [React Query](https://tanstack.com/query/latest)
- [react-window](https://github.com/bvaughn/react-window)
- [Motion / Framer](https://www.framer.com/motion/)
- [MDN: Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)

---

Good luck! 🎯
