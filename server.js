/**
 * Agriculture University Inventory Management System
 * Backend API Server - Express.js
 * Production-Grade Implementation with Security Best Practices
 */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'university_inventory',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  });
};

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Authorization Middleware
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

// Utility: Log Activity
const logActivity = async (userId, action, entityType, entityId, details) => {
  try {
    const conn = await pool.getConnection();
    const query = `
      INSERT INTO activity_logs (userId, action, entityType, entityId, details)
      VALUES (?, ?, ?, ?, ?)
    `;
    await conn.execute(query, [userId, action, entityType, entityId, JSON.stringify(details)]);
    conn.release();
  } catch (error) {
    console.error('Activity logging failed:', error);
  }
};

// ============= AUTHENTICATION ROUTES =============

// Register (Admin only)
app.post('/api/auth/register', authenticateToken, authorize(['admin']), async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, role, department } = req.body;

    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const conn = await pool.getConnection();

    // Check if user exists
    const [existing] = await conn.execute('SELECT userId FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      conn.release();
      return res.status(409).json({ success: false, message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const query = `
      INSERT INTO users (username, email, password, firstName, lastName, role, department, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
    `;
    const [result] = await conn.execute(query, [username, email, hashedPassword, firstName, lastName, role || 'staff', department]);

    conn.release();

    await logActivity(req.user.userId, 'CREATE', 'User', result.insertId, { username, email, role });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
});

// Login
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const conn = await pool.getConnection();
    const [users] = await conn.execute(
      'SELECT userId, username, email, password, firstName, lastName, role, isActive FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      conn.release();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.isActive) {
      conn.release();
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      conn.release();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    conn.release();

    const token = jwt.sign(
      { userId: user.userId, username: user.username, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logActivity(user.userId, 'LOGIN', 'User', user.userId, { timestamp: new Date() });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============= CATEGORIES ROUTES =============

// Get all categories
app.get('/api/categories', authenticateToken, async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    const [categories] = await conn.execute('SELECT * FROM categories ORDER BY categoryName ASC');
    conn.release();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

// Create category
app.post('/api/categories', authenticateToken, authorize(['admin', 'staff']), async (req, res, next) => {
  try {
    const { categoryName, description } = req.body;

    if (!categoryName) {
      return res.status(400).json({ success: false, message: 'Category name required' });
    }

    const conn = await pool.getConnection();
    const query = 'INSERT INTO categories (categoryName, description) VALUES (?, ?)';
    const [result] = await conn.execute(query, [categoryName, description || null]);
    conn.release();

    await logActivity(req.user.userId, 'CREATE', 'Category', result.insertId, { categoryName });

    res.status(201).json({
      success: true,
      message: 'Category created',
      categoryId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
});

// ============= INVENTORY ITEMS ROUTES =============

// Get all inventory items with filters and pagination
app.get('/api/inventory', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', categoryId = '', sortBy = 'itemName', sortOrder = 'ASC' } = req.query;
    const offset = (page - 1) * limit;

    const conn = await pool.getConnection();

    // Build query
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (ii.itemName LIKE ? OR ii.barcode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (categoryId) {
      whereClause += ' AND ii.categoryId = ?';
      params.push(categoryId);
    }

    // Validate sortBy to prevent SQL injection
    const allowedSortColumns = ['itemName', 'quantity', 'totalValue', 'createdAt', 'unitPrice'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'itemName';
    const sortDir = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const query = `
      SELECT 
        ii.itemId, ii.itemName, ii.categoryId, c.categoryName, ii.description,
        ii.quantity, ii.unitPrice, ii.totalValue, ii.reorderLevel, ii.location,
        ii.barcode, ii.createdAt, ii.updatedAt,
        u.firstName, u.lastName, u.username
      FROM inventory_items ii
      LEFT JOIN categories c ON ii.categoryId = c.categoryId
      LEFT JOIN users u ON ii.addedBy = u.userId
      ${whereClause}
      ORDER BY ii.${sortColumn} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    const [items] = await conn.execute(query, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM inventory_items ii LEFT JOIN categories c ON ii.categoryId = c.categoryId ${whereClause}`;
    const [countResult] = await conn.execute(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    conn.release();

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single item details
app.get('/api/inventory/:itemId', authenticateToken, async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const conn = await pool.getConnection();

    const query = `
      SELECT 
        ii.*, c.categoryName,
        u.firstName, u.lastName, u.username
      FROM inventory_items ii
      LEFT JOIN categories c ON ii.categoryId = c.categoryId
      LEFT JOIN users u ON ii.addedBy = u.userId
      WHERE ii.itemId = ?
    `;

    const [items] = await conn.execute(query, [itemId]);
    conn.release();

    if (items.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, data: items[0] });
  } catch (error) {
    next(error);
  }
});

// Create inventory item
app.post('/api/inventory', authenticateToken, authorize(['admin', 'staff']), async (req, res, next) => {
  try {
    const { itemName, categoryId, description, quantity, unitPrice, reorderLevel, location, barcode } = req.body;

    if (!itemName || !categoryId || quantity === undefined || !unitPrice) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const conn = await pool.getConnection();

    const query = `
      INSERT INTO inventory_items 
      (itemName, categoryId, description, quantity, unitPrice, reorderLevel, location, barcode, addedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await conn.execute(query, [
      itemName,
      categoryId,
      description || null,
      quantity,
      unitPrice,
      reorderLevel || 10,
      location || null,
      barcode || null,
      req.user.userId,
    ]);

    // Log stock transaction
    await conn.execute(
      'INSERT INTO stock_transactions (itemId, transactionType, quantityChange, reason, performedBy) VALUES (?, ?, ?, ?, ?)',
      [result.insertId, 'add', quantity, 'Initial stock entry', req.user.userId]
    );

    conn.release();

    await logActivity(req.user.userId, 'CREATE', 'InventoryItem', result.insertId, { itemName, quantity, unitPrice });

    res.status(201).json({
      success: true,
      message: 'Inventory item created',
      itemId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
});

// Update inventory item
app.put('/api/inventory/:itemId', authenticateToken, authorize(['admin', 'staff']), async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { itemName, categoryId, description, quantity, unitPrice, reorderLevel, location, barcode } = req.body;

    const conn = await pool.getConnection();

    // Get current item
    const [currentItem] = await conn.execute('SELECT quantity FROM inventory_items WHERE itemId = ?', [itemId]);
    if (currentItem.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const query = `
      UPDATE inventory_items 
      SET itemName = ?, categoryId = ?, description = ?, quantity = ?, 
          unitPrice = ?, reorderLevel = ?, location = ?, barcode = ?, 
          lastUpdatedBy = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE itemId = ?
    `;

    await conn.execute(query, [
      itemName,
      categoryId,
      description || null,
      quantity,
      unitPrice,
      reorderLevel || 10,
      location || null,
      barcode || null,
      req.user.userId,
      itemId,
    ]);

    // Log stock transaction if quantity changed
    if (quantity !== currentItem[0].quantity) {
      const quantityChange = quantity - currentItem[0].quantity;
      await conn.execute(
        'INSERT INTO stock_transactions (itemId, transactionType, quantityChange, reason, performedBy) VALUES (?, ?, ?, ?, ?)',
        [itemId, quantityChange > 0 ? 'add' : 'remove', Math.abs(quantityChange), 'Stock adjustment', req.user.userId]
      );
    }

    conn.release();

    await logActivity(req.user.userId, 'UPDATE', 'InventoryItem', itemId, { itemName, quantity });

    res.json({ success: true, message: 'Item updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete inventory item
app.delete('/api/inventory/:itemId', authenticateToken, authorize(['admin']), async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const conn = await pool.getConnection();

    const [item] = await conn.execute('SELECT itemName FROM inventory_items WHERE itemId = ?', [itemId]);
    if (item.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    await conn.execute('DELETE FROM inventory_items WHERE itemId = ?', [itemId]);
    conn.release();

    await logActivity(req.user.userId, 'DELETE', 'InventoryItem', itemId, { itemName: item[0].itemName });

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============= REPORTS ROUTES =============

// Dashboard Statistics
app.get('/api/reports/dashboard', authenticateToken, async (req, res, next) => {
  try {
    const conn = await pool.getConnection();

    // Total inventory value
    const [valueResult] = await conn.execute('SELECT SUM(totalValue) as totalValue FROM inventory_items');
    
    // Total items
    const [itemsResult] = await conn.execute('SELECT COUNT(*) as totalItems FROM inventory_items');
    
    // Low stock items
    const [lowStockResult] = await conn.execute(
      'SELECT COUNT(*) as lowStockItems FROM inventory_items WHERE quantity <= reorderLevel'
    );
    
    // Category distribution
    const [categoryResult] = await conn.execute(`
      SELECT c.categoryName, COUNT(ii.itemId) as count, SUM(ii.totalValue) as value
      FROM categories c
      LEFT JOIN inventory_items ii ON c.categoryId = ii.categoryId
      GROUP BY c.categoryId, c.categoryName
      ORDER BY count DESC
    `);

    // Recent transactions
    const [recentResult] = await conn.execute(`
      SELECT ii.itemName, st.transactionType, st.quantityChange, st.createdAt
      FROM stock_transactions st
      JOIN inventory_items ii ON st.itemId = ii.itemId
      ORDER BY st.createdAt DESC
      LIMIT 10
    `);

    conn.release();

    res.json({
      success: true,
      data: {
        totalValue: valueResult[0].totalValue || 0,
        totalItems: itemsResult[0].totalItems || 0,
        lowStockItems: lowStockResult[0].lowStockItems || 0,
        categoryDistribution: categoryResult,
        recentTransactions: recentResult,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Activity logs
app.get('/api/reports/activity', authenticateToken, authorize(['admin']), async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const conn = await pool.getConnection();

    const query = `
      SELECT al.*, u.username, u.firstName, u.lastName
      FROM activity_logs al
      LEFT JOIN users u ON al.userId = u.userId
      ORDER BY al.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const [logs] = await conn.execute(query, [parseInt(limit), offset]);

    const [countResult] = await conn.execute('SELECT COUNT(*) as total FROM activity_logs');

    conn.release();

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Export reports
app.get('/api/reports/export/csv', authenticateToken, async (req, res, next) => {
  try {
    const conn = await pool.getConnection();

    const [items] = await conn.execute(`
      SELECT 
        ii.itemId, ii.itemName, c.categoryName, ii.quantity, 
        ii.unitPrice, ii.totalValue, ii.location, ii.createdAt
      FROM inventory_items ii
      LEFT JOIN categories c ON ii.categoryId = c.categoryId
      ORDER BY ii.itemName
    `);

    conn.release();

    // Create CSV
    let csv = 'Item ID,Item Name,Category,Quantity,Unit Price,Total Value,Location,Created Date\n';
    items.forEach(item => {
      csv += `${item.itemId},"${item.itemName}","${item.categoryName}",${item.quantity},${item.unitPrice},${item.totalValue},"${item.location}","${new Date(item.createdAt).toLocaleString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
