const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // 1. Create Admins Table
        db.run(`CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`, (err) => {
            if (err) console.error('Error creating admins table:', err.message);
            else seedAdmin();
        });

        // 2. Create Products Table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            category TEXT,
            image TEXT,
            stock INTEGER DEFAULT 10
        )`, (err) => {
            if (err) console.error('Error creating products table:', err.message);
            else seedProducts();
        });

        // 3. Create Messages Table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating messages table:', err.message);
        });
    });
}

function seedAdmin() {
    db.get('SELECT * FROM admins WHERE username = ?', ['admin'], async (err, row) => {
        if (err) {
            console.error('Error checking admin:', err.message);
            return;
        }
        if (!row) {
            try {
                // Default admin login: admin / admin123
                const hashedPassword = await bcrypt.hash('admin123', 10);
                db.run('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', hashedPassword], (insertErr) => {
                    if (insertErr) {
                        console.error('Error seeding admin user:', insertErr.message);
                    } else {
                        console.log('Default admin seeded successfully.');
                    }
                });
            } catch (hashErr) {
                console.error('Error hashing password:', hashErr.message);
            }
        }
    });
}

function seedProducts() {
    db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
        if (err) {
            console.error('Error checking products count:', err.message);
            return;
        }
        if (row && row.count === 0) {
            const initialProducts = [
                {
                    name: 'Aura Watch Pro',
                    price: 349.00,
                    category: 'Wearables',
                    description: 'A premium titanium smartwatch with ambient OLED, cellular connectivity, and advanced health tracking metrics.',
                    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
                    stock: 25
                },
                {
                    name: 'Aura Soundscape Max',
                    price: 499.00,
                    category: 'Audio',
                    description: 'Wireless noise-canceling headphones with spatial audio tracking, custom 40mm drivers, and 40-hour battery life.',
                    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
                    stock: 15
                },
                {
                    name: 'Aura Horizon Monitor',
                    price: 1299.00,
                    category: 'Workspace',
                    description: 'A gorgeous 34-inch curved OLED monitor, 240Hz refresh rate, 0.03ms response time, with a built-in USB-C hub.',
                    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
                    stock: 8
                },
                {
                    name: 'Aura Beam Projector',
                    price: 899.00,
                    category: 'Smart Home',
                    description: 'Ultra short-throw 4K laser projector capable of projecting up to a 120-inch screen with HDR10+ and Dolby Atmos speakers.',
                    image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=600&q=80',
                    stock: 12
                },
                {
                    name: 'Aura Charge Dock Duo',
                    price: 79.00,
                    category: 'Accessories',
                    description: 'Premium aluminum MagSafe fast-charging dock that powers your phone and wearables simultaneously in vertical or horizontal orientation.',
                    image: 'https://images.unsplash.com/photo-1622445262465-2481c4574875?auto=format&fit=crop&w=600&q=80',
                    stock: 50
                },
                {
                    name: 'Aura Key Elite',
                    price: 199.00,
                    category: 'Workspace',
                    description: 'Mechanical low-profile tactile keyboard with hot-swappable switches, seamless Bluetooth tri-mode pairing, and a precision rotary dial.',
                    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
                    stock: 30
                }
            ];

            const stmt = db.prepare('INSERT INTO products (name, price, category, description, image, stock) VALUES (?, ?, ?, ?, ?, ?)');
            initialProducts.forEach(product => {
                stmt.run(product.name, product.price, product.category, product.description, product.image, product.stock);
            });
            stmt.finalize(() => {
                console.log('Initial products seeded successfully.');
            });
        }
    });
}

// Database helper functions using Promises
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

module.exports = {
    db,
    all,
    get,
    run
};
