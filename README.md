# Agriculture University Tando Jam - Inventory Management System

A simple, clean, production-grade inventory management system built with PHP, MySQL, HTML5, CSS3, and JavaScript. Focus on SQL database excellence with minimal backend complexity.

## Features

- **Role-Based Authentication** - Admin, Staff, and Viewer roles
- **Complete CRUD Operations** - Create, Read, Update, Delete inventory items
- **Advanced Search & Filtering** - Real-time search with category filters and pagination
- **Responsive Dashboard** - Mobile-first design with statistics and charts
- **Chart Visualizations** - Category distribution and top-value items
- **Activity Logging** - Complete audit trail of all actions
- **Data Export** - CSV export for reports
- **Real-time Inventory Tracking** - Stock level monitoring with low-stock alerts
- **Simple & Clean Code** - No unnecessary frameworks, pure PHP backend

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript ES6+
- Bootstrap 5 - Responsive UI components
- Chart.js - Data visualization
- Vanilla JavaScript (no frameworks)

### Backend
- PHP 7.4+ - Server-side logic
- MySQL 5.7+ - Relational database with optimized schema
- Prepared Statements - SQL injection prevention
- Session-based Authentication - Simple, secure login

### Key Focus: SQL Database
- 6 optimized tables with proper relationships
- Full-text search indexes
- Activity audit logging
- Cascading deletes and constraints
- Generated columns for automatic calculations

## Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx or PHP built-in server
- Modern web browser

## Quick Start (5 Minutes)

### Step 1: Create Database

\`\`\`bash
mysql -u root -p < database/schema.sql
\`\`\`

### Step 2: Configure Database

Edit `config/database.php`:

\`\`\`php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'your_password');
define('DB_NAME', 'inventory_system');
\`\`\`

### Step 3: Start Server

\`\`\`bash
php -S localhost:8000
\`\`\`

### Step 4: Access Application

\`\`\`
URL: http://localhost:8000
Username: admin
Password: admin123
\`\`\`

## File Structure

\`\`\`
inventory-system/
├── index.html                    # Main application UI
├── styles.css                    # Styling
├── script.js                     # Frontend logic
│
├── config/
│   ├── database.php             # Database connection (UPDATE THIS!)
│   └── functions.php            # Helper functions
│
├── api/
│   ├── auth.php                 # Authentication
│   ├── items.php                # Item CRUD
│   └── categories.php           # Category management
│
├── database/
│   └── schema.sql               # Database schema
│
├── README.md                     # This file
├── SETUP_GUIDE.md               # Detailed setup instructions
└── PLACEHOLDERS_GUIDE.md        # Placeholder values reference
\`\`\`

## Database Schema

### Tables
- **users** - User accounts with role-based access (admin, staff, viewer)
- **categories** - Inventory item categories
- **inventory_items** - Main inventory data with calculated total_value
- **transactions** - Stock movement history (in/out/adjustment/damage)
- **activity_logs** - Audit trail for all system actions

### Key Features
- Full-text search on item names and descriptions
- Automatic calculation of total inventory value (quantity × unit_price)
- Low-stock alerts based on configurable minimum levels
- Cascade deletes for data integrity
- Timestamps for all records (created_at, updated_at)

## API Endpoints

### Authentication
\`\`\`
POST   /api/auth.php?action=login    - User login
GET    /api/auth.php?action=logout   - User logout
GET    /api/auth.php?action=current  - Get current user
\`\`\`

### Inventory Items
\`\`\`
GET    /api/items.php?action=list              - Get items (paginated)
GET    /api/items.php?action=list&search=X    - Search items
GET    /api/items.php?action=get&item_id=X    - Get single item
POST   /api/items.php?action=create            - Create item (admin only)
PUT    /api/items.php?action=update            - Update item (admin only)
DELETE /api/items.php?action=delete            - Delete item (admin only)
\`\`\`

### Categories
\`\`\`
GET    /api/categories.php           - Get all categories
\`\`\`

## User Roles

- **Admin** - Full system access, create/edit/delete items
- **Staff** - Can view and add items (limited delete)
- **Viewer** - Read-only access to inventory

## Security Features

- SQL injection prevention with prepared statements
- Bcrypt password hashing
- Session-based authentication
- Input sanitization and validation
- CORS headers
- Role-based access control
- Activity audit logging

## Placeholder Values

Only three values need to be changed in `config/database.php`:

\`\`\`php
define('DB_HOST', 'localhost');      // Your database server
define('DB_USER', 'root');           // Your MySQL user
define('DB_PASS', '');               // YOUR PASSWORD HERE!
\`\`\`

Everything else works with default values. See `PLACEHOLDERS_GUIDE.md` for complete reference.

## Default Credentials (for testing)

- **Username:** admin
- **Password:** admin123

Change these in production!

## Features in Detail

### Dashboard
- Total items count
- Total inventory value (in PKR)
- Low stock items alert count
- Active categories count
- Category distribution chart
- Top 5 high-value items

### Inventory Management
- Add new items with category, quantity, price
- Edit existing items
- Delete items (soft delete via is_active flag)
- Real-time search by item name or description
- Filter by category
- Pagination (10 items per page)

### Reports
- Low stock report with alert levels
- CSV export of all inventory data
- Category-wise stock distribution
- High-value items report

### Activity Tracking
- Complete audit trail in activity_logs table
- User, action, timestamp, and IP address logging
- JSON storage of old and new values for changes

## Common Issues & Solutions

### Database Connection Failed
1. Verify MySQL is running
2. Check credentials in `config/database.php`
3. Confirm database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Login Fails
1. Check admin user exists: `SELECT * FROM users;`
2. Verify password matches `admin123` (or your custom password)
3. Clear browser cookies

### Charts Not Displaying
1. Check browser console (F12) for errors
2. Ensure internet access (Chart.js loaded from CDN)
3. Verify items exist in database

### Permission Denied
1. Set file permissions: `chmod 755 config api`
2. Check PHP can write to session directory
3. Verify MySQL user has proper permissions

## Performance Tips

- Database indexes on frequently searched columns (item_name, category_id, is_active)
- Pagination limits results to 10 items per page
- Full-text search for fast text queries
- Calculated columns for instant inventory value calculation

## Backup & Restore

### Backup
\`\`\`bash
mysqldump -u root -p inventory_system > backup.sql
\`\`\`

### Restore
\`\`\`bash
mysql -u root -p inventory_system < backup.sql
\`\`\`

## Production Deployment

1. Update `config/database.php` with production database credentials
2. Use strong password for MySQL user
3. Deploy on Apache/Nginx (not PHP built-in server)
4. Enable HTTPS/SSL
5. Set proper file permissions (chmod 644 for PHP, chmod 755 for directories)
6. Disable debug mode if added
7. Set up automated backups
8. Change default admin password

## Adding New Users

\`\`\`sql
-- Generate hash in PHP first:
-- php -r "echo password_hash('password123', PASSWORD_BCRYPT);"

INSERT INTO users (username, email, password_hash, full_name, role) 
VALUES ('newuser', 'newuser@autandojam.edu.pk', '$2y$10$HASH...', 'User Name', 'staff');
\`\`\`

## Support & Documentation

- **Setup Guide:** See `SETUP_GUIDE.md`
- **Placeholders Reference:** See `PLACEHOLDERS_GUIDE.md`
- **Database Schema:** See `database/schema.sql`
- **API Functions:** See `config/functions.php`

## License

Free to use and modify for your institution.

---

Built for Agriculture University Tando Jam, Sindh, Pakistan
