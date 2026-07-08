const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path'); // Node utility for file paths

const app = express();
app.use(express.json());
app.use(cors());
// Serve images locally from the backend 'public' folder
// Any image inside backend/public/images/ will be available at http://localhost:5000/images/
app.use(express.static(path.join(__dirname, '../public')));

// 1. Connect to SQLite Database
// Use './data/music_store.db' for a permanent file
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to the in-memory SQLite database.');
});

// 2. Initialize Tables & Seed Data
db.serialize(() => {
    db.run(`CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        brand TEXT,
        price REAL,
        stock INTEGER,
        description TEXT,
        image_url TEXT
    )`);

    const stmt = db.prepare("INSERT INTO products (name, brand, price, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run("M7", "Sire", 1200.00, 3,
        "The ultimate bass guitar with a powerful and versatile sound.",
        "http://localhost:5000/images/Sire_M7.webp"
    );
    stmt.run("Classic Vibe", "Squier", 550.00, 6,
        "A vintage-inspired electric guitar with a timeless design and rich tone.",
        "http://localhost:5000/images/Squier_Classic_Vibe_'50s.png"
    );
    stmt.run("SansAmp Bass Driver DI", "Tech 21", 250.00, 50,
        "A compact and powerful bass preamp pedal that delivers a wide range of tones.",
        "http://localhost:5000/images/SansAmp_Bass_DI.webp"
    );
    stmt.finalize();
});

// 3. Public Route: Get Inventory for the Website
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products WHERE stock > 0", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 4. POS Route: Update Stock after a sale
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

// Restock endpoint for staff back-office management
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

// Product Provisioning Endpoint: Adds an entirely new catalog item to the database
app.post('/api/pos/add-product', (req, res) => {
    const { name, brand, price, stock, description, image_url } = req.body;

    // Crucial Validation Safeguard
    if (!name || !brand || !price == null || !stock == null) {
        return res.status(400).json({ error: "Name, Brand, Price, and Stock are madatory metrics."});
    }

    const sql = `INSERT INTO products (name, brand, price, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?)`;

    // Parse inputs to ensure numerical integrity in the data tables
    const params = [
        name, 
        brand, 
        parseFloat(price), 
        parseInt(stock, 10),
        description || '', 
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

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));