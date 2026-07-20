# LIVE-MUSIC

Live Music is a modern, full-stack retail ecosystem engineered for brick-and-mortar musical instrument showrooms. It bridges a real-time customer-facing e-commerce showroom with a synchronized backend Point of Sale (POS) inventory management system.

The architecture is built as a single unified monorepo to handle the server, the public showroom client, and the internal staff dashboard under one roof.

---

## 🎯 Project Origin & Purpose

Live Music is a personal engineering playground built to lift the hood on modern web applications and master what happens behind the scenes. This project serves a dual purpose:
1. **Architectural Deep Dive:** A hands-on vehicle for learning full-stack mechanics, decoupled state machines, multi-stage asset streaming, and containerized development workflows.
2. **Bringing a Vision to Life:** Building a functional, real-world retail system modeled after premium musical instrument boutiques—a project concept I've wanted to execute for a long time.

---

## ⚡ Core Features Built

* **Resilient Auto-Handshake Processing:** The frontend showroom features an automatic background polling loop. If the server drops or boots out of order, the UI safely captures the network error, displays clean technical diagnostics, and dynamically connects the instant the backend comes online.
* **Zero-Distortion Asset Pipeline:** Tailored configuration using local static file middleware to serve production-ready instrument photos natively without external host dependencies, fitted seamlessly using aspect-ratio preservation layers.
* **Atomic Stock Management:** Real-time transactional tracking using an Express engine backed by an optimized SQLite persistence layer.

---

## 📖 Project Documentation Wiki

To prevent documentation bloat in the root file, all granular technical blueprints, setups, and system logic are modularly decoupled inside the `docs/` folder:

*   **[01. Environment Setup & Monorepo Topography](./docs/01-environment-setup.md)**: Local and Docker boot procedures, network port configurations, and directory-scoped npm package management.
*   **[02. Backend Architecture & API Specifications](./docs/02-backend-architecture.md)**: Database schema definitions, API gateway endpoint routing matrices, data validation, and asset storage cleanup lifecycles.
*   **[03. Frontend Public Showroom Architecture](./docs/03-frontend-public-architecture.md)**: Read-only catalog ingestion strategies, fixed aspect-ratio image rendering, and connection resilience background loops.
*   **[04. Frontend POS Dashboard Architecture](./docs/04-frontend-pos-architecture.md)**: State machine integration for creating/editing/deleting items, and the two-stage multipart file upload handshake.
*   **[05. The Design System (The Vibe)](./docs/05-design-system.md)**: The styling tokens, color palette definitions, layout spacing rules, and typography principles for the "Midnight Lounge" theme.

---

## 📂 Project Blueprint

Below is the definitive directory roadmap for the workspace:

```text
LIVE-MUSIC/
├── docs/                           # Central Wiki Documentation Engine
│   ├── 01-environment-setup.md     # Bootstrapping, dependencies, & npm commands
│   ├── 02-backend-architecture.md  # Core API endpoints & mock data layers
│   ├── 03-frontend-public-architecture.md # Read-only showroom UI logic
│   ├── 04-frontend-pos-architecture.md    # Admin CRUD state machine & asset uploads
│   └── 05-design-system.md         # Midnight Lounge theme style guide
│
├── backend/                        # Node.js & Express API Engine
│   ├── data/                       # Local SQLite database directory (.db binaries)
│   ├── public/                     # Static file server directory
│   │   └── images/                 # Uncropped product imagery (asset storage)
│   └── src/
│       ├── controllers/            # Transaction handlers (e.g., "processing a sale")
│       ├── routes/                 # Express endpoint maps (e.g., /api/products)
│       ├── models/                 # Database schema rules & migrations
│       ├── middleware/             # Validation & security rules
│       ├── app.js                  # App configuration setup
│       └── server.js               # Primary server initialization entrypoint
│
├── frontend-public/                # Customer Showroom Website (Vite + React)
│   ├── public/                     # Public web assets (favicon, titles)
│   └── src/
│       ├── assets/                 # Background wallpapers & styling graphics
│       ├── components/             # Reusable layout elements (e.g., ProductCard.jsx)
│       ├── App.jsx                 # Showroom viewport state coordinator
│       ├── index.css               # Core global design overrides
│       └── main.jsx                # React engine mount point
│
├── frontend-pos/                   # Staff Operations Dashboard (Sales & Inventory)
│   ├── public/                     # Static web assets (favicon, browser icons)
│   └── src/
│       ├── assets/                 # Dashboard icons and custom styling graphics
│       ├── App.jsx                 # Operations command center & inventory CRUD dashboard
│       ├── index.css               # Administration panel visual styles
│       └── main.jsx                # React engine mount point for staff panel
│
├── docker-compose.yml              # Container orchestration map
├── .gitignore                      # Global source control exclusion registry
└── README.md                       # Documentation ecosystem manual

```