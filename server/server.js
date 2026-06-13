const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// ----------------------------------------------------
// PRODUCT ROUTES (DML: SELECT, INSERT, UPDATE, DELETE)
// ----------------------------------------------------

// SELECT ALL PRODUCTS (With Optional Filters)
app.get('/api/products', async (req, res) => {
    try {
        const { category, search } = req.query;
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (category && category !== 'All') {
            sql += ' AND category = ?';
            params.push(category);
        }

        if (search) {
            sql += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const products = await db.all(sql, params);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// SELECT A SINGLE PRODUCT
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// INSERT NEW PRODUCT (CREATE)
app.post('/api/products', async (req, res) => {
    const { name, price, description, category, image, stock } = req.body;
    if (!name || !price || !category) {
        return res.status(400).json({ error: 'Name, price, and category are required' });
    }
    try {
        const result = await db.run(
            'INSERT INTO products (name, price, description, category, image, stock) VALUES (?, ?, ?, ?, ?, ?)',
            [name, price, description || '', category, image || 'https://via.placeholder.com/150', stock || 10]
        );
        res.status(201).json({ id: result.id, message: 'Product created successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// UPDATE PRODUCT
app.put('/api/products/:id', async (req, res) => {
    const { name, price, description, category, image, stock } = req.body;
    if (!name || !price || !category) {
        return res.status(400).json({ error: 'Name, price, and category are required' });
    }
    try {
        const result = await db.run(
            'UPDATE products SET name = ?, price = ?, description = ?, category = ?, image = ?, stock = ? WHERE id = ?',
            [name, price, description || '', category, image, stock, req.params.id]
        );
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found or no changes made' });
        }
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// DELETE PRODUCT
app.delete('/api/products/:id', async (req, res) => {
    try {
        const result = await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// ----------------------------------------------------
// CONTACT MESSAGES (DML: INSERT, SELECT, DELETE)
// ----------------------------------------------------

// INSERT MESSAGE (SUBMIT)
app.post('/api/messages', async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    try {
        await db.run(
            'INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject || '', message]
        );
        res.status(201).json({ message: 'Inquiry submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// SELECT ALL MESSAGES (ADMIN ONLY)
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await db.all('SELECT * FROM messages ORDER BY created_at DESC');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// DELETE A MESSAGE (ADMIN ONLY)
app.delete('/api/messages/:id', async (req, res) => {
    try {
        const result = await db.run('DELETE FROM messages WHERE id = ?', [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.json({ message: 'Message deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// ----------------------------------------------------
// ADMIN AUTHENTICATION
// ----------------------------------------------------

// ADMIN LOGIN
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const admin = await db.get('SELECT * FROM admins WHERE username = ?', [username]);
        if (!admin) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Send a simple simulated token for simplicity
        res.json({ token: 'aura-admin-session-active', username: admin.username });
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// FALLBACK ROUTE
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
