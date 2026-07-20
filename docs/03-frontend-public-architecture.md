# 03. Frontend Public Showroom Architecture

The `frontend-public` application provides a clean, responsive, read-only e-commerce experience tailored for real-time customer browsing.

---

## 🔄 Architectural Scope: The "R" in CRUD
To maintain operational safety, the customer-facing interface has no direct data mutation capabilities. It interfaces exclusively with read vectors:
*   **Data Ingestion:** Hits `GET http://localhost:5000/api/products` on component mounting to paint the digital showroom floor.
*   **Isolated Business Logic:** Includes consumer interactions like item filtering, feature searches, and cart additions. No administrative payloads are exposed to this viewport.

---

## 🎨 Component Highlight: `ProductCard.jsx`
The display engine shows live instrument data through an asset-focused layout:

*   **Fixed Aspect Ratios:** Uses CSS object rules (`object-fit-contain`) wrapped in bounding height elements to preserve uploaded instrument shapes without clipping or edge stretching.
*   **Dynamic Inventory Badging:** Tracks stock volume values conditionally to adapt user options:
    *   `stock > 0`: Displays available item totals along with an active gold-accented "Add to Cart" button.
    *   `stock === 0`: Disables the button, updates classes to a muted design, and stamps a red "Sold Out" warning overlay.
*   **Static Resource Streaming:** Strips away external asset host needs by pointing image source targets directly at the backend server directory paths (`product.image_url`).

---

## 🛡️ Resilient Connection Processing
To safeguard user experiences against service interruptions, the client uses an automatic error intercept loop:
1. If the API gateway goes offline, the public UI captures the request failure gracefully and displays clean technical diagnostics.
2. Background loops poll the network connection to locate service restoration events.
3. The live interface re-seeds the layout automatically the instant the server boots back online, eliminating manual page refreshes.