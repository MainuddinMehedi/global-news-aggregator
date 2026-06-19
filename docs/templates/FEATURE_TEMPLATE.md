<!-- 
  DOCS ARCHITECTURE RULE: 
  When creating completely new architectural changes or domains, create a NEW FOLDER.
  Inside that folder, create an index doc (e.g., `0. feature-name.md`) and wire up everything related to it there. 
  Do not wipe out anything that is relevant. Only remove stale or unimportant notes.
-->

# [FEATURE_NAME]

> **Feature Status:** `[Brainstorming | Implementation Planned | In Progress | Implemented | Deprecated]`  
> **Feature ID:** `[UNIQUE_FEATURE_ID]`

---

## 📖 References Map
_(Items that require quick checkup, future plans, or jotting down)_
- [Link Name](path/to/doc.md) - Brief description of what this note is.
- [Link Name](path/to/doc.md) - Brief description of what this note is.

---

## 🎯 Current Direction
_(Always keep this section up-to-date. This outlines the current intentions and what we are actively trying to achieve with this feature. Before doing any tasks, we align with this intention.)_

- What is the immediate goal right now?
- Who is getting impacted?
- What is coming next?

👉 **[Immediate Action Board](action-board.md)**

---

## ⏳ Explicitly Deferred (v2 / Future Notes)
_(Items that are good ideas but not required right now. When the Immediate Action Board is empty, these items move up into the Current Direction.)_

- Idea or task deferred to later.
- Idea or task deferred to later.

---
---

## 📚 Technical Overview & Deep Dive
_(This section contains heavy schemas, architecture notes, and deep technical overviews. It is pushed to the bottom so it doesn't clutter the immediate action workflow. Update this occasionally when breaking changes or major architectural shifts occur.)_

### Table of Contents
- [1. Overview & Objective](#1-overview--objective)
- [2. Technical Architecture & Data Model](#2-technical-architecture--data-model)
- [3. Research & Decision Matrix](#3-research--decision-matrix)

### 1. Overview & Objective
What is this feature and why does it exist? 

### 2. Technical Architecture & Data Model
```prisma
// Relevant schemas
```

### 3. Research & Decision Matrix
Historical context on why certain libraries, tools, or patterns were chosen over others.
