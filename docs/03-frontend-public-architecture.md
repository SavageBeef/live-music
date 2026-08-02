# 03. Frontend Public Showroom Architecture

The `frontend-public` application provides a clean, responsive, interactive e-commerce experience tailored for real-time customer browsing, persistent session cart management, and atomic transaction processing.

---

## 🔄 Architectural Scope & Transactional Integration
The public interface operates around read vectors, persistent local session state, and single-payload atomic checkout execution:

*   **Data Ingestion & Ground-Truth Synchronization:** Queries `GET http://localhost:5000/api/products` on component mount and via automated background heartbeat intervals to populate showroom inventory.
*   **Persistent Client Session State:** Leverages browser `localStorage` to preserve active cart sessions across page refreshes and browser restarts.
*   **Real-Time Stock Reconciliation Engine:** Reconciles incoming database stock counts against active local cart items (`cartRef`) so background polling does not override local item reservations.
*   **Atomic Checkout Processing:** Executes transactions via a single `POST /api/checkout` request containing full basket payloads (`{ items: [{ id, quantity, price }] }`), handling transaction receipts and atomic rollback rejections cleanly.

---

## 💾 Session Persistence & Inventory Reconciliation

### 1. Lazy `localStorage` Synchronization
The shopping basket state is lazy-initialized on startup from `localStorage` (`live_music_cart`). An explicit `useEffect` syncs updates back to disk whenever cart contents change, while `handleCheckout` purges the key upon successful transaction completion:

```javascript
const [cart, setCart] = useState(() => {
  try {
    const savedCart = localStorage.getItem('live_music_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (err) {
    console.error("Failed to load saved cart:", err);
    return [];
  }
});
```

### 2. Live Stock Reconciliation (`data.map`)
To prevent background heartbeat syncs (10-second interval) from overwriting local cart reservations with raw database totals, `fetchProducts` reconciles ground-truth database rows against active local cart quantities using a persistent `cartRef` (`useRef(cart)`):

```javascript
const reconciledProducts = data.map(product => {
  const inCart = cartRef.current.find(item => item.id === product.id);
  const cartQty = inCart ? inCart.quantity : 0;
  return {
    ...product,
    stock: Math.max(0, product.stock - cartQty)
  };
});
```

---

## 🛒 Checkout Basket & Cart Drawer Interface

The client features a dual-tier cart interaction model:

*   **Persistent Bottom Action Bar:** Displays when `cart.length > 0`, rendering aggregate item totals, live dollar sub-totals, a modal drawer toggle ("Review Cart"), and a direct payment button.
*   **Itemized Cart Drawer Modal (`isCartOpen`):** An interactive modal table offering:
    *   Incremental unit controls (`+` / `−`) managed via `handleUpdateQuantity()`.
    *   Line-item eviction controls via `handleRemoveFromCart()`.
    *   Dynamic subtotal calculations per item row and grand total summaries.
*   **Submission Guard (`submitting`):** Disables checkout triggers and displays a loading spinner during active network requests to eliminate duplicate transaction submissions.

---

## 🎨 Component Highlight: `ProductCard.jsx`
The display engine shows live instrument data through an asset-focused layout:

*   **Fixed Aspect Ratios:** Uses CSS object rules (`object-fit-contain`) wrapped in bounding height elements to preserve uploaded instrument shapes without clipping or edge stretching.
*   **Dynamic Inventory Badging:** Tracks stock volume values conditionally to adapt user options:
    *   `stock > 0`: Displays available item totals along with an active gold-accented "Add to Cart" button.
    *   `stock === 0`: Disables the button, updates classes to a muted design, and stamps a red "Sold Out" warning overlay.
*   **Static Resource Streaming:** Strips away external asset host needs by pointing image source targets directly at backend server directory paths (`product.image_url`).

---

## 🛡️ Resilient Connection Processing & Dual-Mode UI
To safeguard user experiences against service interruptions, the client implements an automated connection monitor:

1. **Heartbeat Polling Loop:** An active `setInterval` loop queries `GET /api/products` every 10 seconds to detect server state changes automatically.
2. **Dual-Tier UI Strategy:**
   * **Initial Boot Failure:** Displays a full-screen blocking loader screen ("TUNING THE INSTRUMENTS...") when initial database contact cannot be made.
   * **Mid-Session Connection Drop:** Renders a non-blocking top danger alert banner (`⚠️ Connection Lost`) if the server drops mid-session, leaving already loaded showroom items readable.
3. **Dynamic Network Binding:** Interactive controls (Checkout action buttons and Navbar Cart Badge) listen directly to the `isOffline` state, dynamically toggling Bootstrap styling (`btn-warning` vs. `btn-secondary`) and setting `disabled` guards when the API gateway is offline.

---

## 🧹 Lifecycle & Memory Safety (`isMounted` Pattern)
To prevent background thread memory leaks when components unmount during active network requests:
* An `isMounted` mutable reference (`useRef(true)`) tracks component lifespan.
* Async fetch callbacks verify `isMounted.current === true` prior to executing state dispatchers (`setProducts`, `setIsOffline`, `setErrorStatus`).
* The `useEffect` cleanup return phase sets `isMounted.current = false` and safely terminates active `setInterval` timers.