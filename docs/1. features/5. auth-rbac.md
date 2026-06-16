# Authentication & Role-Based Access Control (RBAC)

> **Feature Status:** Implemented  
> **Feature ID:** `AUTH_RBAC`

---

## 📖 References Map

_(Items that require quick checkup, future plans, or jotting down)_

---

### 📖 Table of Contents
- [[#1. Overview & Objective]]
- [[#3. Research & Decision Matrix]]
- [[#4. Technical Architecture & Data Model]]
- [[#5. Implementation Notes & Reference Guide]]
- [[#6. Future Roadmap & "Remember It" Notes]]
- [[#7. Brainstorming & Feature Ideas]]

---

## 1. Overview & Objective

The **Authentication & Role-Based Access Control (RBAC)** system secures user operations, maintains database-backed sessions, and strictly isolates administrative tools from public endpoints. The design focuses on a seamless, frictionless public experience that dynamically elevates privileges when required (e.g., bookmarking, locking topics, or checking system metrics).

### User Scopes & Privileges

The system divides access into three explicit tiers:

1. **Public User:** 
   - *Privileges:* View home feed, read story clusters, search articles, apply 3-axis filters, and view public "News Insights."
   - *UX flow:* Protected actions (e.g., liking/bookmarking, configuring custom topics) trigger a global login modal rather than hard redirects to a login page.
2. **Authenticated User (`USER`):**
   - *Privileges:* All public capabilities plus bookmarking articles, saving analytical view filters, and configuring "Locked Topics" (custom tracking queries).
   - *Session tracking:* Authenticated via JWT/Database sessions check in Server Actions and API routes.
3. **Administrator (`ADMIN`):**
   - *Privileges:* All user capabilities plus access to the Admin Dashboard (`/system-supar-admin`), adding/removing RSS feed sources, altering active LLM models/prompt configurations, and viewing system logs.
   - *Route protection:* Layout-level server session validation.
---

## 3. Research & Decision Matrix

### Dimensional Falsification Matrix

| Candidate Solution | Efficacy & Determinism | Operational Cost / Latency | Complexity / Debt | Outcome / Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Stateless JWT Tokens (Self-Managed)** (Storing sessions in browser cookies, verified cryptographically) | ❌ **Medium** (Hard to revoke sessions instantly if a user's role is downgraded or account is suspended) |  **Low** (Zero database hits during verification) | ⚠️ **Medium** (Requires writing custom refresh token loops and crypto logic) | **Disproven** (Hard to manage dynamic role changes) |
| **Option B: Database-Backed Sessions via NextAuth** (Storing session tokens in PostgreSQL; verified via Prisma adapter) |  **High** (Extremely secure. Database session validation allows immediate account suspension, role changes, and token revocation) | ⚠️ **Medium** (Adds a DB query on session validation checks, mitigated by database pooling) |  **Low** (Leverages stable, standard industry library) | **Accepted** (Current Implementation) |

---

## 4. Technical Architecture & Data Model

The authentication architecture is powered by **NextAuth.js** integrated with the Prisma ORM adapter.

### Data Model (Prisma Schema)

```prisma
model User {
  id            String            @id @default(uuid())
  name          String?
  email         String?           @unique
  emailVerified DateTime?
  image         String?
  role          UserRole          @default(USER)
  accounts      Account[]
  sessions      Session[]
  articleBookmarks ArticleBookmark[]
  findingBookmarks FindingBookmark[]
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

enum UserRole {
  USER
  ADMIN
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Route Protection Architecture
The admin route `/system-supar-admin` is protected at the server-layout layer using Next.js Server Sessions:

```typescript
// app/system-supar-admin/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/"); // Muted redirect for unauthorized access
  }
  
  return <>{children}</>;
}
```

---

## 5. Implementation Notes & Reference Guide

### Key Code Artifacts
- [route.ts](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/frontend/app/api/auth/%5B...nextauth%5D/route.ts) — The NextAuth handler endpoint configuring providers (Google OAuth, Magic Links).
- [schema.prisma](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/prisma/schema.prisma) — Relational models for Sessions, Users, and Accounts.
- [layout.tsx](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/frontend/app/system-supar-admin/layout.tsx) — Route protection check for admin sub-routes.
- [Navbar.tsx](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/frontend/components/layout/Navbar.tsx) — Houses login triggers, auth popovers, and role-conditional link listings.

---

## 6. Future Roadmap & "Remember It" Notes

- **Multi-Tenant Scopes:** If the aggregator scales to support distinct teams, the `User` schema will require a `Tenant` or `Organization` join table to prevent search results bleeding between user accounts.
- **Admin Secret Safety:** The admin route path `/system-supar-admin` should eventually be masked or dynamically configured via environment variables to hide the entry point from automated scrapers/bots.

---

## 7. Brainstorming & Feature Ideas

- **Magic Link Token Expirations:** Tighten Magic Link tokens to expire within 15 minutes of issuance to prevent stale emails from acting as open doors.
- **Dynamic Role Elevation:** Implement step-up authentication (e.g., requesting password/passkey verification) before performing heavy mutations in the admin dashboard.

---

## 🔗 Related Logs
_(Historical decisions, audits, and performance metrics that do not require quick checkups)_

- *No related research logs currently exist. This document serves as the primary technical layout for this feature.*
