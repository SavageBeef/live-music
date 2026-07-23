# 04. Frontend POS Dashboard Architecture

The `frontend-pos` application is a secure internal command portal built for store managers and staff to handle inventory updates, track stock counts, and execute full data-mutating CRUD operations.

---

## ⚙️ CRUD State Machine Integration
The entire back-office management center is controlled through a unified React state vehicle that toggles operations smoothly based on an `editingId` pointer state:

*   **Intake Mode (`editingId === null`):** The form headers display "ITEM INTAKE PANEL". Submissions route toward the backend's creation path via standard `POST` requests.
*   **Modification Mode (`editingId === active_id`):** The dashboard adapts to show "EDIT CATALOG ITEM", pre-filling all input values with the active item data. Submissions change targets to target a `PUT` update query request.
*   **Defensive Intercept Chains:** Deletion commands (`handleDeleteProduct`) are wrapped in `window.confirm` dialogue prompts to verify staff intent before firing a destructive `DELETE` network mutation request.

---

## 📸 Two-Stage Multipart Upload Handshake
To eliminate manual copy-pasting of text asset URLs, the dashboard uses a decoupled two-stage submission chain when a product with a new file is saved:

```text
[Staff Selects Local Instrument File]
                  │
                  ▼
   ┌─────────────────────────────┐
   │ Stage 1: File Isolation     │ ──► Generates RAM token via URL.createObjectURL()
   └─────────────────────────────┘     (Provides immediate offline visual preview)
                  │
                  ▼
   ┌─────────────────────────────┐
   │ Stage 2: Multipart Upload   │ ──► FormData streams file binary to POST /api/upload
   └─────────────────────────────┘     (Server responds with a fresh static filename string)
                  │
                  ▼
   ┌─────────────────────────────┐
   │ Stage 3: Payload Sync       │ ──► JSON object maps server string path to database
   └─────────────────────────────┘     (Uses 'payload' variable compilation, avoiding ghost states)
```

---

## 🧹 Memory Optimization & Input Management

### Client-Side Resource Garbage Collection
Because local browser object previews consume active system RAM, the interface runs memory cleanups to keep performance snappy:
```javascript
if (filePreview) URL.revokeObjectURL(filePreview); // Reclaims browser memory
setFilePreview(null);
```
This cleanup process triggers automatically on form reset, edit cancellations, or successful entry processing.

### Uncontrolled Input Handling
HTML `<input type="file" />` elements cannot be driven directly by React's standard state objects. To reset the displayed file name after saving changes, the app targets the DOM element manually:
```javascript
document.getElementById('productImageInput').value = ''; // Wipes file label state cleanly
```

---

## 📡 Real-Time Health Diagnostics & Heartbeat
The Back-Office POS tracks active network status using a dual-state diagnostic framework:

* **Heartbeat Interval:** Queries `GET /api/products` every 5 seconds to verify server health and refresh live inventory ledgers.
* **State Categorization:**
  * `systemStatus` (`ONLINE` | `OFFLINE`): Controls the navbar status badge indicator.
  * `hasConnected` (Boolean): Distinguishes whether an outage is an initial connection failure ("Server Unavailable") or a mid-session loss ("Connection Lost").

---

## 🖼️ Unified Image Asset Preview Engine
The intake panel supports both new local file selections and existing database assets through a unified preview container:

* **Draft Selection:** When a staff member picks a new image file, `URL.createObjectURL()` creates a temporary browser RAM preview URL for instant rendering.
* **Database Asset Display:** When editing an existing product (`editingId !== null`), the container falls back to rendering the saved remote image string (`form.image_url`).
* **Memory Cleanup:** Executing a form reset, switching edit targets, or cancelling an operation triggers `URL.revokeObjectURL()` to free browser RAM and resets uncontrolled DOM `<input type="file" />` values to eliminate memory leaks.