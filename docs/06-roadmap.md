# 06. Project Roadmap & Development Milestones

This document tracks the architectural phases, active sprints, and future engineering milestones for the **LIVE-MUSIC** ecosystem.

---

## 🗺️ Project Phases at a Glance

```text
┌──────────────────────────────┐
│  Phase 1: MVP Showroom       │ ──► In-Memory Stack & Read-Only UI (Done)
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Phase 2: Admin Operations   │ ──► Full CRUD Machine & Asset Pipeline (Done)
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Phase 3: Persistent Storage │ ──► Physical SQLite Migration (CURRENT TASK)
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Phase 4: Core POS Features  │ ──► Transaction Ledger & Checkout Flow (Planned)
└──────────────────────────────┘
```

---

## 🟢 Phase 1: MVP Foundation & Showroom Prototyping
*Goal: Establish the monorepo topography and build a resilient consumer browsing viewport.*

*   [x] Initialize three-tier monorepo directory layout (`backend`, `frontend-public`, `frontend-pos`).
*   [x] Configure container orchestration using Docker and `docker-compose.yml` for isolated runtimes.
*   [x] Deploy rapid Express API engine backed by an in-memory SQLite temporary database.
*   [x] Build `frontend-public` product showroom layout using React + Vite.
*   [x] Implement client-side connection resilience and auto-handshake background polling loops.

---

## 🟢 Phase 2: Administrative CRUD & Asset Pipelines
*Goal: Empower store staff to manage physical inventory and stream production-ready instrument photos natively.*

*   [x] Construct unified CRUD state machine inside `frontend-pos` driven by contextual forms.
*   [x] Integrate `multer` middleware on the backend to parse incoming `multipart/form-data` file streams.
*   [x] Build two-stage upload workflow leveraging local browser RAM previews (`URL.createObjectURL`).
*   [x] Implement automated server-side file cleanup handlers using the native `fs` module to purge orphaned instrument images during product modifications or deletions.
*   [x] Apply "Midnight Lounge" design tokens across both application frontends to unify the boutique aesthetic.

---

## 🟡 Phase 3: Persistent Storage & Data Migration
*Goal: Shift away from volatile server RAM to a permanent, persistent database file with safe host volume mapping.*

*   [ ] **[ONGOING]** Refactor database configuration script to target a physical binary file (`/data/live_music.db`).
*   [ ] Verify proper creation of persistent directories on server startup if they do not exist.
*   [ ] Configure Docker volume mount points to prevent data loss whenever containers tear down or reboot.
*   [ ] Write a robust SQL migration/seeding routine that safely populates base stock on a clean file creation without duplicating entries on subsequent boots.

---

## 🔴 Phase 4: Core POS Features & Transaction Ledger
*Goal: Expand backend business logic to handle actual checkout workflows and sales analytics.*

*   [ ] Design a relational `sales` or `transactions` ledger database schema table.
*   [ ] Build transaction-safe checkout controllers that decrement structural item stock numbers atomically when a purchase request is fired.
*   [ ] Add historical receipt viewports and basic revenue data cards to the staff `frontend-pos` dashboard.
*   [ ] Implement lightweight input validations on stock changes to prevent accidental human entry errors.