# 02. Backend Architecture & API Specifications

The core server is a lightweight Express gateway designed to execute atomic transactions against a local SQLite instance and handle static multi-part media uploads.

---

## 💾 Persistent SQLite Data Architecture
The backend utilizes disk-based SQLite file storage (e.g., `live_music.db`) to ensure inventory records, pricing updates, stock counts, and product details persist across server restarts and deployments. 

Upon server startup, the database driver initializes the persistent file connection and runs a defensive schema setup query to ensure the table structure exists before serving API routes:

```sql
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    brand TEXT,
    price REAL,
    stock INTEGER,
    description TEXT,
    image_url TEXT
);
```

---

## 🗺️ API Gateway Routing Matrix

| HTTP Verb | Endpoint Route Path | Intended Consumer | Operational Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public & POS | Retrieves available inventory data strings. |
| `POST` | `/api/upload` | Staff POS Only | Handles raw multi-part file image disk writes. |
| `POST` | `/api/pos/add-product` | Staff POS Only | Injects a new product line row into SQLite. |
| `PUT` | `/api/pos/update-product/:id` | Staff POS Only | Modifies structural fields of an inventory row. |
| `DELETE`| `/api/pos/delete-product/:id` | Staff POS Only | Drops an inventory item line row entirely. |
| `POST` | `/api/pos/restock` | Staff POS Only | Increments item stock counts in standard batches. |

---

## 🛠️ Data Integrity & Defensive Practices

### Numerical Type Casting
The backend enforces explicit type validation before database binding to neutralize floating-point drift or corrupt inputs:
*   `parseFloat(price)` maintains accurate financial accounting decimal values.
*   `parseInt(stock, 10)` locks stock changes strictly to whole numbers.

### Validation Guardrails
A strict structural evaluation intercepts creation payloads to verify that mandatory properties are present before executing SQL bindings:
```javascript
if (!name || !brand || price == null || stock == null) {
    return res.status(400).json({ error: "Name, Brand, Price, and Stock are mandatory metrics."});
}
```

### Automatic File Storage Cleanup
To keep server storage use optimized, the native `fs` module is integrated into data mutation routes:
*   **On Product Deletion:** The system checks the item row, removes the physical file from `public/images/`, and drops the database row.
*   **On Image Update:** If a new file is uploaded over an old entry, the old asset file is immediately removed from the disk.

```javascript
const deleteDiskImage = (imageUrl) => {
    if (!imageUrl || imageUrl.includes('No-Image-Placeholder.svg')) return; // Safety guard
    
    const filename = path.basename(imageUrl);
    const filePath = path.join(__dirname, '../public/images', filename);

    fs.unlink(filePath, (err) => { ... }); // Evicts orphaned file from server
};
```

## 🛒 Transactional Checkout Architecture (`POST /api/checkout`)

The `/api/checkout` route handler executes multi-item order processing within a single, isolated database transaction (`BEGIN TRANSACTION` -> `COMMIT` / `ROLLBACK`). 

### Key Guarantees
1. **Atomic Integrity:** If any single item in a multi-product cart fails stock validation or database write, the entire transaction rolls back completely—preventing orphaned receipt headers or partial stock deductions.
2. **Asynchronous Synchronization:** Wraps `sqlite3` callback functions in native `Promise` instances resolved via `Promise.all()` to prevent event-loop race conditions during transaction commits.
3. **Negative Stock Prevention:** Employs atomic SQL guard conditions (`WHERE stock >= ?`) and evaluates `this.changes` to intercept over-purchasing attempts.

---

### 🧪 Endpoint Verification & CLI Testing Specifications

Below are the terminal test suites used to verify both successful checkout execution and atomic rollback safety across OS platforms.

#### Test A: Successful Transaction (Valid Stock)
Simulates purchasing 1x item (`id: 2`) with sufficient stock.

* **Windows PowerShell (`Invoke-RestMethod`):**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/checkout" -Method POST -ContentType "application/json" -Body '{"items": [{"id": 2, "quantity": 1, "price": 499.99}]}'
  ```

* **Windows Command Prompt (CMD - Escaped Quotes):**
  ```cmd
  curl -X POST http://localhost:5000/api/checkout -H "Content-Type: application/json" -d "{\"items\": [{\"id\": 2, \"quantity\": 1, \"price\": 499.99}]}"
  ```

* **Linux / macOS Bash (`curl`):**
  ```bash
  curl -X POST http://localhost:5000/api/checkout \
    -H "Content-Type: application/json" \
    -d '{
      "items": [
        { "id": 2, "quantity": 1, "price": 499.99 }
      ]
    }'
  ```

* **Expected HTTP 201 Response:**
  ```json
  {
    "message": "Transaction completed successfully!",
    "saleId": 1,
    "totalAmount": 499.99
  }
  ```

* **Note if using curl.exe in PowerShell:** If you prefer running curl.exe directly in PowerShell instead of Invoke-RestMethod, use:

	```powershell
	curl.exe -X POST http://localhost:5000/api/checkout -H "Content-Type: application/json" -d '{\"items\": [{\"id\": 2, \"quantity\": 1, \"price\": 499.99}]}'
	```

---

#### Test B: Atomic Rollback (Out of Stock / Invalid Item)
Simulates attempting to purchase an item with zero stock (`id: 1`).

* **Windows PowerShell (`Invoke-RestMethod`):**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/checkout" -Method POST -ContentType "application/json" -Body '{"items": [{"id": 1, "quantity": 1, "price": 1299.00}]}'
  ```

* **Windows Command Prompt (CMD - Escaped Quotes):**
  ```cmd
  curl -X POST http://localhost:5000/api/checkout -H "Content-Type: application/json" -d "{\"items\": [{\"id\": 1, \"quantity\": 1, \"price\": 1299.00}]}"
  ```

* **Linux / macOS Bash (`curl`):**
  ```bash
  curl -X POST http://localhost:5000/api/checkout \
    -H "Content-Type: application/json" \
    -d '{
      "items": [
        { "id": 1, "quantity": 1, "price": 1299.00 }
      ]
    }'
  ```

* **Expected HTTP 400 Response (Rollback Triggered):**
  ```json
  {
    "error": "Checkout failed. Insufficient stock or invalid item.",
    "details": "Insufficient stock or invalid product ID: 1"
  }
  ```

* **Note if using curl.exe in PowerShell:** If you prefer running curl.exe directly in PowerShell instead of Invoke-RestMethod, use:

	```powershell
	curl.exe -X POST http://localhost:5000/api/checkout -H "Content-Type: application/json" -d '{\"items\": [{\"id\": 1, \"quantity\": 1, \"price\": 1299.00}]}'
	```