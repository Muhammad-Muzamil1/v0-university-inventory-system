# University Inventory Management System - Complete Setup Guide

## Overview
This is a **clean, simple, production-ready inventory system** built with:
- **Frontend:** HTML5, CSS3, Bootstrap 5, JavaScript (Vanilla)
- **Backend:** PHP (Simple, no framework required)
- **Database:** MySQL (Pure SQL, well-optimized)

## System Requirements

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx or PHP built-in server
- Modern web browser
- 50MB disk space

## Quick Installation (5 minutes)

### Step 1: Get the Database Ready

\`\`\`bash
# Option A: Create database from schema
mysql -u root -p < database/schema.sql

# Option B: Manual creation
mysql -u root -p
\`\`\`

\`\`\`sql
CREATE DATABASE inventory_system;
USE inventory_system;
-- Then paste contents of database/schema.sql
\`\`\`

### Step 2: Configure Database Connection

Edit `config/database.php` and update these values:

\`\`\`php
define('DB_HOST', 'localhost');  // Your MySQL server
define('DB_USER', 'root');       // Your MySQL username
define('DB_PASS', '');           // Your MySQL password
define('DB_NAME', 'inventory_system');
\`\`\`

### Step 3: Start the Server

**Option A: Using PHP Built-in Server (Easiest)**
\`\`\`bash
php -S localhost:8000
\`\`\`

**Option B: Using Apache**
1. Copy project to `htdocs` folder
2. Access via `http://localhost/inventory-system`

**Option C: Using Nginx**
Configure nginx.conf and restart

### Step 4: Access the Application

\`\`\`
URL: http://localhost:8000
Username: admin
Password: admin123
\`\`\`

---

## File Structure & What Each File Does

\`\`\`
inventory-system/
│
├── index.html                    # Main application interface
├── styles.css                    # All styling
├── script.js                     # Frontend logic (search, forms, charts)
│
├── config/
│   ├── database.php             # Database connection (UPDATE THIS!)
│   └── functions.php            # Helper functions (auth, sanitization, logging)
│
├── api/
│   ├── auth.php                 # Login/Logout
│   ├── items.php                # Item CRUD operations
│   └── categories.php           # Category management
│
├── database/
│   └── schema.sql               # Database tables & initial data
│
├── README.md                     # Quick reference
└── SETUP_GUIDE.md               # This file
\`\`\`

---

## Core Features Explained

### 1. **Authentication System**
- Simple login with username/password
- Session-based (no JWT complexity)
- Three roles: Admin, Staff, Viewer
- Default admin account: `admin` / `admin123`

### 2. **Inventory Management**
- Add/Edit/Delete items
- Search & filter by category
- Real-time stock tracking
- Automatic total value calculation

### 3. **Dashboard**
- Total items count
- Total inventory value (in PKR)
- Low stock alerts
- Charts showing distribution

### 4. **Reporting**
- CSV export
- Low stock reports
- Category-wise breakdown
- Top 5 high-value items

### 5. **Security**
- SQL injection prevention (prepared statements)
- Password hashing (bcrypt)
- Input sanitization
- Activity logging
- Role-based access control

---

## Placeholder Values & How to Fill Them

### Database Configuration (in `config/database.php`)

\`\`\`php
// UPDATE THESE THREE!
define('DB_HOST', 'localhost');      // Where is your MySQL?
define('DB_USER', 'root');           // MySQL username
define('DB_PASS', '');               // MySQL password (blank if none)
define('DB_NAME', 'inventory_system'); // Keep this as is
\`\`\`

### Default Admin User (in database/schema.sql)

The database includes a default admin:
\`\`\`
Username: admin
Password: admin123 (hashed)
Email: admin@autandojam.edu.pk
\`\`\`

You can change this after login or add new users via SQL:

\`\`\`sql
-- Add a new staff member
INSERT INTO users (username, email, password_hash, full_name, role) 
VALUES ('staff1', 'staff@autandojam.edu.pk', PASSWORD_HASH_HERE, 'Staff Member', 'staff');
\`\`\`

---

## API Endpoints Reference

### Authentication
\`\`\`
POST   /api/auth.php?action=login    → Login user
GET    /api/auth.php?action=logout   → Logout user
GET    /api/auth.php?action=current  → Get logged-in user
\`\`\`

### Inventory Items (CRUD)
\`\`\`
GET    /api/items.php?action=list              → Get all items (paginated)
GET    /api/items.php?action=list&search=X    → Search items
GET    /api/items.php?action=get&item_id=X    → Get single item
POST   /api/items.php?action=create            → Create new item (admin only)
PUT    /api/items.php?action=update            → Update item (admin only)
DELETE /api/items.php?action=delete            → Delete item (admin only)
\`\`\`

### Categories
\`\`\`
GET    /api/categories.php           → Get all categories
\`\`\`

---

## Common Issues & Solutions

### Problem: "Can't connect to database"
**Solution:**
1. Check MySQL is running: `mysql --version`
2. Check credentials in `config/database.php`
3. Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Problem: "Login fails with correct credentials"
**Solution:**
1. Check if admin user exists: `SELECT * FROM users WHERE username='admin';`
2. If not, re-import schema
3. Clear browser cookies and try again

### Problem: "404 - File not found"
**Solution:**
1. Make sure you're accessing `http://localhost:8000` (not `/index.html`)
2. Check file permissions: `chmod 755 config api database`
3. Check PHP can read files

### Problem: "Charts not showing"
**Solution:**
1. Open browser console (F12) for errors
2. Make sure internet is available (loads Chart.js from CDN)
3. Check if items are actually in database

---

## Adding New Users

### Via MySQL
\`\`\`sql
-- Generate password hash in PHP first:
-- php -r "echo password_hash('mypassword', PASSWORD_BCRYPT);"

INSERT INTO users (username, email, password_hash, full_name, role) 
VALUES ('newuser', 'newuser@autandojam.edu.pk', '$2y$10$HASH_HERE', 'New User', 'staff');
\`\`\`

### User Roles Explained
- **Admin:** Full access (create, edit, delete items)
- **Staff:** Can view and add items (cannot delete)
- **Viewer:** Can only view items and reports

---

## Customization Guide

### Change University Name
Edit `index.html` - Find "Agriculture University Tando Jam" and replace

### Change Colors
Edit `styles.css` - Find `:root` section:
\`\`\`css
:root {
    --primary: #2563eb;      /* Change this */
    --success: #10b981;      /* Or this */
    /* ... */
}
\`\`\`

### Add New Fields to Items
1. Add column to database: `ALTER TABLE inventory_items ADD COLUMN field_name VARCHAR(100);`
2. Update form in `index.html`
3. Update API in `api/items.php`

---

## Performance Tips

1. **Database:** Items table has indexes on frequently searched columns
2. **Frontend:** Uses pagination (10 items per page)
3. **Caching:** Browser caches static assets (CSS, JS)

---

## Backup & Restore

### Backup Database
\`\`\`bash
mysqldump -u root -p inventory_system > backup.sql
\`\`\`

### Restore Database
\`\`\`bash
mysql -u root -p inventory_system < backup.sql
\`\`\`

---

## Production Deployment

To run on a live server:

1. Update `config/database.php` with production database
2. Set `DEBUG` to `false` in config
3. Use HTTPS only
4. Change default admin password
5. Set proper file permissions: `chmod 644 *.php`
6. Use Apache/Nginx (not PHP built-in server)
7. Enable backups

---

## Support

For issues:
1. Check error logs
2. Review browser console (F12)
3. Check `activity_logs` table for audit trail
4. Contact: admin@autandojam.edu.pk

---

## License

Free to use and modify for your institution.
