# 02. Backend Architecture & API Specifications

The core server is a lightweight Express gateway designed to execute atomic transactions against a local SQLite instance and handle static multi-part media uploads.

---

## 💾 In-Memory Data Modeling
During phase-one development, the system evaluates states using a volatile in-memory SQLite stack initialization. The relational schema is defined as:

```sql
CREATE TABLE products (
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