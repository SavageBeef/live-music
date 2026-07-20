const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Resolve paths for the persistent binary storage
const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'live_music.db');

// Ensure physical directory exists on the host/container filesystem
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Database directory created at: ${dbDir}`);
}

// Connect to the permanent SQLite database file
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error('❌ SQLite connection error:', err.message);
    console.log(`💾 Connected to persistent SQLite database at: ${dbPath}`);
    initializeDatabase();
});

// Create schema and safely seed if table is vacant
function initializeDatabase() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            brand TEXT,
            price REAL,
            stock INTEGER,
            description TEXT,
            image_url TEXT
        )`);

        // Check rows to prevent duplication loops on server reboot
        db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
            if (err) return console.error('❌ Table count verification failed:', err.message);

            if (row.count === 0) {
                console.log('Catalog is vacant. Seeding baseline products...');
                
                // Structured array of objects for better readability and maintenance
                const sampleProducts = [
                    {
                        name: "Marcus Miller M7 5-String",
                        brand: "Sire",
                        price: 1299.00,
                        stock: 0,
                        description: "A premium boutique-tier powerhouse engineered for maximum sonic versatility, blending a striking solid flame maple top with a highly flexible active 18V preamp layout and dual humbuckers to deliver deep low-end punch and pristine modern clarity.",
                        image_url: "http://localhost:5000/images/Sire_M7.webp"
                    },
                    {
                        name: "Classic Vibe '50s Stratocaster",
                        brand: "Squier",
                        price: 499.99,
                        stock: 6,
                        description: "An authentic nod to the era of its origin, delivering quintessential 1950s single-coil snap and tone with an elegant vintage-tinted gloss neck finish and period-correct hardware.",
                        image_url: "http://localhost:5000/images/Squier_Classic_Vibe_'50s.png"
                    },
                    {
                        name: "SansAmp Bass Driver DI",
                        brand: "Tech 21",
                        price: 269.00,
                        stock: 50,
                        description: "The absolute industry gold standard for live sound and studio tracking, serving up warm tube-amplifier emulation, customizable drive structures, and robust direct-input utility.",
                        image_url: "http://localhost:5000/images/SansAmp_Bass_DI.webp"
                    }
                ];

                const stmt = db.prepare(`
                    INSERT INTO products (name, brand, price, stock, description, image_url) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                
                sampleProducts.forEach((product) => {
                    stmt.run(
                        product.name, 
                        product.brand, 
                        product.price, 
                        product.stock, 
                        product.description, 
                        product.image_url
                    );
                });
                
                stmt.finalize(() => {
                    console.log('✅ Core catalog seeding completed successfully.');
                });
            } else {
                console.log(`ℹ️ Persistent database contains ${row.count} records. Skipping seeding sequence.`);
            }
        });
    });
}

module.exports = db;