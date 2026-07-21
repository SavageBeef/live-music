# 01. Environment Setup & Monorepo Topography

This document outlines the layout, environmental boundaries, and dependencies required to initialize and run the **LIVE-MUSIC** ecosystem locally.

---

## 📂 System Topology
The codebase uses a unified monorepo structure to sync backend business logic with our twin frontends:
*   `backend/` - Core Node.js & Express API Gateway + Media Store.
*   `frontend-public/` - Customer-facing web showroom.
*   `frontend-pos/` - Internal staff administrative dashboard.

---

## ⚡ Core Dependency Registry

### 1. Backend API Gateway Engine
*   `express`: Underlying REST routing framework.
*   `sqlite3`: In-memory prototyping persistence layer.
*   `cors`: Handles cross-origin handshakes across distinct local network boundaries.
*   `multer`: Multi-part stream parser deployed to capture incoming image file uploads.

### 2. Frontend Web Frameworks (Public & POS)
*   `vite`: High-performance build tooling and dev server.
*   `bootstrap`: Front-end component utility utilized for tabular data layouts and responsive styling.

---

## 🌐 Network & Port Allocations
To avoid local process collisions, the development environments are strictly mapped to the following addresses:

| Project Component | App Environment | Dev Server Target Port |
| :--- | :--- | :--- |
| **`backend`** | Node.js Runtime | `http://localhost:5000` |
| **`frontend-public`** | Customer Showroom | `http://localhost:5173` |
| **`frontend-pos`** | Staff Operations | `http://localhost:5174` |

> [!NOTE]
> **Network Host Binding (`host: true`)**
> Both frontend applications configure `server.host: true` inside their respective `vite.config.js` files. This instructs Vite to bind to `0.0.0.0` (all network interfaces) rather than strictly binding to loopback (`127.0.0.1`). Because this is handled directly in the configuration, appending `-- --host` to startup scripts (`npm run dev -- --host`) is no longer required in the terminal.
>
> * **Inside Docker (Primary Intent):** Required so that Docker port forwarding (`5173:5173` / `5174:5174`) can deliver browser requests from your **host machine** across the container's virtual network interface (`eth0`). Without this, Vite rejects host requests because it only listens inside the container's loopback interface. As a secondary byproduct, LAN devices can also reach the container via the host's IP address.
> * **On Host Machine (Direct Node Runtime):** The host machine already has direct access to `localhost`. The primary benefit here is exposing the server to your local network (LAN), allowing real-time testing on physical mobile devices or secondary screens via `http://<host-ip>:<port>`.
> * **Host Firewall Considerations:** For external network or mobile access to function (in either Docker or local mode), your host operating system's firewall (e.g., Windows Defender, macOS Firewall, or `ufw`) may need an inbound rule allowing traffic through target ports `5173` and `5174`.

---

## 🚀 Boot Procedures
To spin up the network architecture manually during development, open the distinct terminal windows and run:

### Local
```bash
# Terminal 1: Launch Backend API
cd backend && node --watch src/server.js

# Terminal 2: Launch Public Showroom
cd frontend-public && npm run dev

# Terminal 3: Launch Staff Dashboard
cd frontend-pos && npm run dev
```

### Docker (Recommended)

```bash
# Terminal 0: Local shell
cd live-music
docker desktop start 
docker compose up -d # Spin-up container with the settings specified in docker-compose.yml

# Terminal 1: Launch Backend API
docker compose exec dev-shell sh # Switch local shell to container shell
cd backend && node --watch src/server.js

# Terminal 2: Launch Public Showroom
docker compose exec dev-shell sh 
cd frontend-public && npm run dev

# Terminal 3: Launch Staff Dashboard
docker compose exec dev-shell sh
cd frontend-pos && npm run dev
```

---

## 🛠️ Miscellaneous: NPM Package Management & Commands

Because this workspace operates as a monorepo without global root dependencies, all package operations must be scoped directly inside their target sub-directories to prevent package cross-contamination.

### 1. Installing Packages
Always navigate (`cd`) into the specific target directory before executing an install command:
```bash
# Example: Adding a package to the backend
cd backend
npm install <package-name>

# Example: Adding a development dependency to the POS dashboard
cd frontend-pos
npm install <package-name> --save-dev
```

### 2. Auditing Installed Packages
To review what packages are currently installed in a specific environment without scrolling through a massive tree of sub-dependencies, run a shallow list query:
```bash
cd backend
npm list --depth=0
```

### 3. Updating Packages
To update packages to their latest safe versions within the constraints of your `package.json` semver rules, or to force-bump a specific module:
```bash
# Update all sub-directory modules safely
npm update

# Explicitly bump a package to the latest release version
npm install <package-name>@latest
```

### 4. Removing Packages
To cleanly evict a package and simultaneously purge it from the environment's `package.json` manifest:
```bash
cd frontend-public
npm uninstall <package-name>
```

### 5. Vulnerability Auditing & Security Patches

In production environments, security posture must be actively maintained. Because dependencies are isolated within their respective component folders, vulnerability scans must be executed directly inside the target directory.

#### A. Running a Security Scan
To generate a comprehensive report of known vulnerabilities (CVEs) tracking through your dependency tree:
```bash
cd backend
npm audit
```
This performs a live lookup against the central GitHub Advisory Database and outputs a breakdown categorized by severity (`Low`, `Moderate`, `High`, `Critical`).

#### B. Executing Automatic Non-Breaking Patches
For vulnerabilities that can be resolved within your existing `package.json` semver constraints (e.g., minor or patch level bumps):
```bash
cd backend
npm audit fix
```
*Note: This is safe to run as it will not introduce breaking structural updates to your application modules.*

#### C. Handling Stubborn or Major Vulnerabilities
If an advisory requires a major version bump that could potentially introduce breaking changes into the codebase, `npm audit fix` will bypass it. To force the upgrade anyway:
```bash
npm audit fix --force
```
> [!WARNING] 
> Always run your local test suites or execute a sanity check on your UI environments (`frontend-public` / `frontend-pos`) immediately after a forced audit fix to ensure an upgraded package hasn't deprecated an active method or component layout.