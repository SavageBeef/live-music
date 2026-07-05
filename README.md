# LIVE-MUSIC

Live Music is a modern, full-stack retail ecosystem engineered for brick-and-mortar musical instrument showrooms. It bridges a real-time customer-facing e-commerce showroom with a synchronized backend Point of Sale (POS) inventory management system.

The architecture is built as a single unified monorepo to handle the server, the public showroom client, and the internal staff dashboard under one roof.

---

## ⚡ Core Features Built

* **Resilient Auto-Handshake Processing:** The frontend showroom features an automatic background polling loop. If the server drops or boots out of order, the UI safely captures the network error, displays clean technical diagnostics, and dynamically connects the instant the backend comes online.
* **Zero-Distortion Asset Pipeline:** Tailored configuration using local static file middleware to serve production-ready instrument photos natively without external host dependencies, fitted seamlessly using aspect-ratio preservation layers.
* **Atomic Stock Management:** Real-time transactional tracking using an Express engine backed by an optimized SQLite persistence layer.

---

## 📂 Project Blueprint

Below is the definitive directory roadmap for the workspace:

```text
LIVE-MUSIC/
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
│
├── docker-compose.yml              # Container orchestration map
├── .gitignore                      # Global source control exclusion registry
└── README.md                       # Documentation ecosystem manual

```