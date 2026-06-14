# AI & Agentic System Instructions

You must strictly adhere to these guiding principles for all tasks, including codebase navigation, code modification, architectural research, feature planning, and execution.

## 1. Architectural Supremacy & Logic Encapsulation
* **No Out-of-Place Logic:** Never place logic where it does not belong (e.g., business logic leaking into UI components, database queries inside controllers, or helper logic mixed into core services). Keep layers strictly isolated.
* **Topic-Concerned Code:** Ensure every code block, function, and module strictly adheres to its single, primary responsibility. If a task requires cross-cutting concerns, abstract them properly instead of writing inline spaghetti code.

## 2. Research & Decision Making via Falsifiability Testing
When researching solutions, tools, database structures, or architectural paths, you must execute a rigorous falsification assessment rather than choosing the path of least resistance or popular trends.

### The Dimensional Falsification Matrix
Evaluate every engineering candidate against these core architectural vectors, actively trying to *disprove* why an option might fail, choke, or drift under our specific long-term conditions:
* **Efficacy & Determinism:** Does the solution solve the problem reliably, or does it introduce unpredictable behavior, race conditions, or edge-case failures?
* **Operational Overhead & Cost:** What are the hidden taxes? Consider runtime latency, API token consumption, cold-start delays, or compute requirements.
* **Maintenance & Complexity (Debt):** Does this approach introduce a heavy footprint? Evaluate how hard it will be to debug, test, write types for, or upgrade this code in 12 months.
* **Scope Realism:** Is this solution over-engineered for our current phase? Prioritize tools that precisely fit our immediate constraints while leaving clean paths for evolutionary scaling.

### The Falsification Lifecycle (Execution Method)
1. **Divergent Discovery:** Run a targeted local or web search to map out the available ecosystem approaches matching the problem space. Provide high-quality documentation links or reference cues.
2. **Stress-Testing Alternatives:** For every viable option, explicitly point out its structural breaking point (e.g., "This pattern breaks down when data size exceeds X," "This library adds un-typed runtime overhead," or "This introduces a single point of failure").
3. **Ingest User Insights:** Actively parse, parse-link, and critically evaluate any raw domain thoughts, research findings, or manual notes the user places in the `docs/` folder. Treat user notes as a source of hard constraints.
4. **Architectural Ledger Logging:** Document the final trade-off matrix inside an independent `.md` file within `docs/`. This file must map out the core problem, the disproven alternatives, critical quirks, and the long-term system trajectory implications of the chosen path.

## 3. Context Verification & Local Discovery
* **Mandatory Search Pre-requisite:** Before writing any code, creating a plan, or generating a new file, perform a quick local search or grep for relevant keywords, filenames, and existing utilities.
* **Prevent Redundancy:** Verify if a similar component, utility function, or architectural pattern already exists in the codebase. Always reuse existing patterns and abstractions instead of duplicating logic.

## 4. Architectural Auditing & Drift Tracking
* **Active Vigilance:** During any task, audit the surrounding codebase for architectural flaws, inconsistent patterns, or accumulated technical debt.
* **Log Drifts Immediately:** Every time an anomaly, flaw, or necessary workaround is discovered, document it in a separate, dedicated `.md` file inside the `docs/` directory to track the architecture as it grows.

## 5. Active Housekeeping, Pruning & Cleanup
* **Obsolete Code Deletion:** When refactoring, modifying the architecture, or replacing a feature, you must actively delete old files, modules, and configurations that have become irrelevant. Never leave dead code or ghost files in the workspace.
* **Ephemeral Testing Hygiene:** Any temporary files, playground scripts, scratchpads, or isolation test files generated during your implementation must be completely deleted once the final implementation passes verification.
* **Dependency & Import Auditing:** After pruning files, scan for and remove any dangling imports, unused exports, or dead variables across the remaining codebase.

## 6. Programmer Readability & Craftsmanship
* **Clarity Over Cleverness:** Write expressive, self-documenting code. Use meaningful variable names and avoid dense, cryptic optimization tricks unless explicitly requested.
* **Formatting & Whitespace:** Maintain optimal readability by using proper vertical spacing (gaps between logical blocks), consistent indentation, and clean grouping of related statements.

## 7. Communication & Plain-Language Mapping
* **Prose Over Raw Diffs:** Explain implementation plans, new features, or structural code modifications in clear, conceptual prose *before* or alongside showing code changes. Reduce cognitive load by mapping out *how* the system behaves conceptually.

## 8. Next.js 16 & Cache Components Architecture
* **Implicit PPR & Static Shells:** Every route generates a static HTML shell by default. Wrap any dynamic request-time code (e.g., searching query parameters, user-specific data) inside `<Suspense>` boundaries to prevent blocking the shell render.
* **Leaf Client Components:** Keep `use client` components strictly at the leaves of the component tree. Pass data fetching and async server components down as `children` or custom slots rather than wrapping layouts or sub-pages globally in client context.
* **Composition Over Prop Drilling:** Do not drill server-fetched data down through deep component paths. Use React component composition to inject server components cleanly into leaf client containers.
* **Isolated Fetching & De-duplication:** Do not hesitate to call the same data-fetching function or database query independently across separate components. Rely on React `cache()` (request memoization) and the Next.js Data Cache to automatically flatten duplicate operations into a single network or database hit.
* **Granular "use cache":** Do not apply `"use cache"` to whole routes or entire files blindly. Apply it inline at the individual function or granular data-fetching component level. Use `cacheLife()` profiles and explicit `cacheTag()` for targeting revalidation.
* **No Runtime Access inside Cache Scopes:** Never call `cookies()`, `headers()`, or `searchParams` inside a `"use cache"` scope. Extract these values outside the scope at the server layer and pass them explicitly as serialized function primitives.
* **Server-Driven Mutations:** Use `"use server"` Actions exclusively for forms and data mutations. Call `revalidateTag(tag, 'max')` inside the action block immediately following successful execution to invalidate the server and update client states.
* **State Preservation Navigation (React Activity):** Next.js 16 preserves client UI state during backward/forward navigations (components are hidden rather than unmounted). You must build explicit reset handlers or use `useLayoutEffect` cleanups for client modals, popovers, or forms to prevent lingering stale UI state.

## 9. Documentation Architecture & Master Index Verification
* **Strict Hierarchy:** Keep the `docs/` directory clean and modular by breaking topics out into highly specific sub-files. This folder explicitly serves as a dual-ledger for AI system logs and direct user research insights/notes.
* **Atomic Index Verification:** Every time you create, modify, or delete a file (including code files or `.md` files inside the `docs/` directory), you must **immediately update the master index** (`docs/README.md` or `docs/index.md`). If a file is deleted because it became irrelevant, its reference must be purged from the index instantly.
