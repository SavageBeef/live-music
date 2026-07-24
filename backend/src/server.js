const express = require('express');
const cors = require('cors');
const path = require('path'); // Node utility for file paths
const multer = require('multer');
const fs = require('fs');
const db = require('./models/db');

const app = express();
app.use(express.json());
app.use(cors());
// Serve images locally from the backend 'public' folder
// Any image inside backend/public/images/ will be available at http://localhost:5000/images/
app.use(express.static(path.join(__dirname, '../public')));

// Configure storage for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/images'));
    },
    filename: (req, file, cb) => {
        // Create unique filenames to prevent collisions
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// Helper utility to safely delete uploaded images from the server disk
const deleteDiskImage = (imageUrl) => {
    if (!imageUrl) return;
    
    // Safety check: Never delete your default system vector placeholders
    if (imageUrl.includes('No-Image-Placeholder.svg') || imageUrl.includes('default.svg')) {
        return;
    }

    // Extract just the filename from the end of the URL string
    const filename = path.basename(imageUrl);
    const filePath = path.join(__dirname, '../public/images', filename);

    fs.unlink(filePath, (err) => {
        if (err) console.error(`⚠️ Asset Orphan Alert: Failed to delete disk image: ${err.message}`);
        else console.log(`🗑️ Disk Purge Success: Removed ${filename}`);
    });
};


// --- API ROUTES ---

// Get Inventory Endpoint: Returns all products in the database (READ Operation)
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Destock Endpoint: Records a sale and decrements the stock of a product in the database (UPDATE Operation)
app.post('/api/pos/sell', (req, res) => {
    const { id, quantity } = req.body;
    
    db.run(
        "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
        [quantity, id, quantity],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(400).json({ error: "Out of stock or invalid ID" });
            
            res.json({ message: "Sale recorded successfully" });
        }
    );
});

// Atomic Checkout Route Handler: Processes a batch of sales in a single transaction (UPDATE Operation)
app.post('/api/checkout', (req,res) => {
    const { items } = req.body; // Expects array: [{ id: 1, quantity: 2, price: 1299.00 }, ...]
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Checkout payload must contain an array of items." });
    }

    // Calculate total amount across all cart items
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Step 1: Create sale record header
        db.run("INSERT INTO sales (total_amount) VALUES (?)", [totalAmount], function (err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: "Failed to record transaction header.", details: err.message });
            }

            const saleId = this.lastID; // ID of the newly created sale row

            // Step 2: Map each item to a Promise that records the line item and deducts stock
            const itemPromises = items.map((item) => {
                return new Promise((resolve, reject) => {
                    // Record line item
                    db.run(
                        "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
                        [saleId, item.id, item.quantity, item.price],
                        (itemErr) => {
                            if (itemErr) return reject(itemErr);

                            // Deduct stock safely (WHERE stock >= quantity prevents negative stock)
                            db.run(
                                "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
                                [item.quantity, item.id, item.quantity],
                                function (stockErr) {
                                    if (stockErr) return reject(stockErr);
                                    
                                    // NOTE: sqlite3 binds 'this.changes' to traditional callbacks
                                    if (this.changes === 0) {
                                        return reject(new Error(`Insufficient stock or invalid product ID: ${item.id}`));
                                    }
                                    
                                    resolve(); // Item successfully recorded and stock deducted
                                }
                            );
                        }
                    );
                });
            });

            // Step 3: Wait for ALL item operations to complete before deciding to Commit or Rollback
            Promise.all(itemPromises)
                .then(() => {
                    db.run("COMMIT", (commitErr) => {
                        if (commitErr) {
                            db.run("ROLLBACK");
                            return res.status(500).json({ error: "Failed to commit transaction." });
                        }
                        return res.status(201).json({
                            message: "Transaction completed successfully!",
                            saleId: saleId,
                            totalAmount: totalAmount
                        });
                    });
                })
                .catch((error) => {
                    // If ANY item fails stock check or insert, roll back the entire transaction!
                    db.run("ROLLBACK");
                    return res.status(400).json({ 
                        error: "Checkout failed. Insufficient stock or invalid item.",
                        details: error.message 
                    });
                });
        });
    });
});

// Restock Endpoint: Increases the stock of a product in the database (UPDATE Operation)
app.post('/api/pos/restock', (req, res) => {
  const { id, quantity } = req.body;
  if (!id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: "Valid product ID and increment quantity are required." });
  }

  // Find the current stock first, then increment it
  db.get('SELECT stock, name FROM products WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Product not found." });

    const newStock = row.stock + parseInt(quantity, 10);
    db.run('UPDATE products SET stock = ? WHERE id = ?', [newStock, id], function(updateErr) {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      console.log(`📦 RESTOCK: ${row.name} stock increased to ${newStock}`);
      res.json({ id, name: row.name, updatedStock: newStock });
    });
  });
});

// Product Provisioning Endpoint: Adds a new catalog item to the database (CREATE Operation)
app.post('/api/pos/add-product', (req, res) => {
    const { name, brand, price, stock, description, image_url } = req.body;

    console.log("📥 BACKEND RECEIVED IMAGE_URL:", image_url);

    // Crucial Validation Safeguard
    if (!name || !brand || price == null || stock == null) {
        return res.status(400).json({ error: "Name, Brand, Price, and Stock are mandatory metrics."});
    }

    const sql = `INSERT INTO products (name, brand, price, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?)`;

    // Parse inputs to ensure numerical integrity in the data tables
    const params = [
        name, brand, parseFloat(price), parseInt(stock, 10), description || '', 
        image_url || 'http://localhost:5000/images/No-Image-Placeholder.svg'
    ];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        console.log(`🆕 PROVISIONED: New item "${name}" successfully registered with ID #${this.lastID}`);
        res.status(201).json({
            message: "New product added successfully.",
            product: this.lastID, name, brand
        });
    });
});

// Product Update Endpoint: Modifies an existing catalog item in the database (UPDATE Operation)
app.put('/api/pos/update-product/:id', (req, res) => {
    const { id } = req.params;
    const { name, brand, price, stock, description, image_url } = req.body;

    // Validate that at least the required fields are provided for update
    if (!name || !brand || price == null || stock == null) {
        return res.status(400).json({ error: "Name, Brand, Price, and Stock must be provided for update." });
    }

    // Query old image state to compare asset path changes
    db.get("SELECT image_url FROM products WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        // If the user uploaded a brand new image, destroy the old one
        if (row && row.image_url !== image_url) {
            deleteDiskImage(row.image_url);
        }

        const sql = `
            UPDATE products 
            SET name = ?, brand = ?, price = ?, stock = ?, description = ?, image_url = ?
            WHERE id = ?  
        `;
        const params = [
            name.trim(), brand.trim(), parseFloat(price), parseInt(stock, 10), description || '', 
            image_url || 'http://localhost:5000/images/No-Image-Placeholder.svg',id
        ];

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Product not found or no changes made." });
            console.log(`📝 UPDATED: Product ID #${id} has been modified successfully.`);
            res.json({ message: "Product updated successfully.", productId: id });
        });
    });
});

// Product Deletion Endpoint: Remove a catalog item from the database (DELETE Operation)
app.delete('/api/pos/delete-product/:id', (req, res) => {
    const { id } = req.params;
    // Find the image URL associated with this record first
    db.get("SELECT image_url FROM products WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Product not found." });

        // Trigger disk file elimination
        deleteDiskImage(row.image_url);
        // Clear the entry out of SQLite database memory entirely
        db.run("DELETE FROM products WHERE id = ?", [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Product not found." });
            console.log(`🗑️ DELETED: Product ID #${id} has been removed from the catalog.`);
            res.json({ message: "Product deleted successfully.", productId: id });
        });
    });
});

// Image Upload Endpoint: Handles file uploads for product images and returns the accessible URL (CREATE Operation)
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    
    // Return the URL for the frontend to save in the database
    const imageUrl = `http://localhost:5000/images/${req.file.filename}`;
    res.json({ imageUrl });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));