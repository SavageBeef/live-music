# 03. Frontend Public Showroom Architecture

The `frontend-public` application provides a clean, responsive, read-only e-commerce experience tailored for real-time customer browsing.

---

## 🔄 Architectural Scope: Read-Focused Showroom
To maintain operational safety and align with Phase 3 milestones, the public interface operates primarily around read vectors and local UI session state:

*   **Data Ingestion:** Hits `GET http://localhost:5000/api/products` on component mounting and via background heartbeat intervals to paint the digital showroom floor.
*   **Isolated Business Logic:** Manages local consumer interactions including stock calculations, UI alerts, and client-side shopping cart state without administrative access.
*   **Phase 4 Preview (Provisional Stub):** Includes a basic client-side checkout prototype (`handleCheckout`) preparing the UI for full transactional integration in Phase 4.

---

## 🎨 Component Highlight: `ProductCard.jsx`
The display engine shows live instrument data through an asset-focused layout:

*   **Fixed Aspect Ratios:** Uses CSS object rules (`object-fit-contain`) wrapped in bounding height elements to preserve uploaded instrument shapes without clipping or edge stretching.
*   **Dynamic Inventory Badging:** Tracks stock volume values conditionally to adapt user options:
    *   `stock > 0`: Displays available item totals along with an active gold-accented "Add to Cart" button.
    *   `stock === 0`: Disables the button, updates classes to a muted design, and stamps a red "Sold Out" warning overlay.
*   **Static Resource Streaming:** Strips away external asset host needs by pointing image source targets directly at the backend server directory paths (`product.image_url`).

---

## 🛡️ Resilient Connection Processing & Dual-Mode UI
To safeguard user experiences against service interruptions, the client implements an automated connection monitor:

1. **Heartbeat Polling Loop:** An active `setInterval` loop queries `GET /api/products` every 10 seconds to detect server state changes automatically.
2. **Dual-Tier UI Strategy:**
   * **Initial Boot Failure:** Displays a full-screen blocking loader screen ("TUNING THE INSTRUMENTS...") when initial database contact cannot be made.
   * **Mid-Session Connection Drop:** Renders a non-blocking top danger alert banner (`⚠️ Connection Lost`) if the server drops mid-session, leaving already loaded showroom items readable.
3. **Dynamic Network Binding:** Interactive controls (Checkout action button and Navbar Cart Badge) listen directly to the `isOffline` state, dynamically toggling Bootstrap classes (`bg-warning` vs. `bg-secondary`) and setting `disabled` guards when the API gateway is offline.

---

## 🧹 Lifecycle & Memory Safety (`isMounted` Pattern)
To prevent background thread memory leaks when components unmount during active network requests:
* An `isMounted` mutable reference (`useRef(true)`) tracks component lifespan.
* Async fetch callbacks verify `isMounted.current === true` prior to executing state dispatchers (`setProducts`, `setIsOffline`, `setErrorStatus`).
* The `useEffect` cleanup return phase sets `isMounted.current = false` and safely terminates active `setInterval` timers.