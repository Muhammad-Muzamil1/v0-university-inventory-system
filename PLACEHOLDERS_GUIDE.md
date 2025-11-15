# Placeholders Guide - University Inventory Management System

## What Are Placeholders?

Placeholders are values you need to **replace** with your actual information. This guide shows exactly where they are and how to fill them.

---

## 1. DATABASE PLACEHOLDERS

### Location: `config/database.php`

\`\`\`php
// PLACEHOLDER 1: Database Host
define('DB_HOST', 'localhost');  
// Replace 'localhost' with your database server address
// Examples: localhost, 192.168.1.100, db.yourdomain.com

// PLACEHOLDER 2: Database User
define('DB_USER', 'root');  
// Replace 'root' with your MySQL username
// Example: inventory_user

// PLACEHOLDER 3: Database Password
define('DB_PASS', '');  
// Replace '' with your MySQL password
// Example: 'MySecurePass123'

// PLACEHOLDER 4: Database Name
define('DB_NAME', 'inventory_system');  
// Keep this OR change if you want different database name
\`\`\`

### Quick Fill Example:
\`\`\`php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'mypassword123');
define('DB_NAME', 'inventory_system');
\`\`\`

---

## 2. UNIVERSITY INFORMATION PLACEHOLDERS

### Location: `index.html`

Find and replace these:

\`\`\`html
<!-- PLACEHOLDER: University Name -->
<p class="text-muted">Agriculture University Tando Jam</p>

<!-- PLACEHOLDER: Organization Email -->
<small>admin@autandojam.edu.pk</small>

<!-- PLACEHOLDER: University Location -->
<!-- Not directly in HTML but update in database if needed -->
\`\`\`

---

## 3. DEFAULT ADMIN USER PLACEHOLDERS

### Location: `database/schema.sql`

\`\`\`sql
-- PLACEHOLDER: Admin Email
INSERT INTO users (username, email, password_hash, full_name, role) 
VALUES ('admin', 'admin@autandojam.edu.pk', '$2y$...', 'System Administrator', 'admin');
--                            ^-- Change this email

-- PLACEHOLDER: Admin Password (This is hashed)
-- The password 'admin123' is already hashed
-- To change it, generate new hash using PHP:
-- php -r "echo password_hash('newpassword', PASSWORD_BCRYPT);"
\`\`\`

---

## Complete Placeholder List with Examples

| File | Line | Placeholder | Default | Example | Need to Change? |
|------|------|-------------|---------|---------|-----------------|
| `config/database.php` | 3 | DB_HOST | localhost | localhost | Maybe |
| `config/database.php` | 4 | DB_USER | root | root | Maybe |
| `config/database.php` | 5 | DB_PASS | (empty) | mypass123 | **YES** |
| `config/database.php` | 6 | DB_NAME | inventory_system | inventory_system | No |
| `index.html` | ~27 | University Name | Agriculture University Tando Jam | Your University | Maybe |
| `index.html` | ~28 | Organization Email | admin@autandojam.edu.pk | your@email.com | Maybe |
| `database/schema.sql` | ~65 | Admin Email | admin@autandojam.edu.pk | your@email.com | Maybe |
| `database/schema.sql` | ~65 | Admin Username | admin | admin | No |
| `database/schema.sql` | ~65 | Admin Password Hash | (bcrypt hash) | Generate new | Maybe |

---

## Step-by-Step: Replacing All Placeholders

### Step 1: Database Configuration (MOST IMPORTANT)
\`\`\`bash
# Open this file
config/database.php

# Find these lines and update:
define('DB_HOST', 'localhost');     // Change if needed
define('DB_USER', 'root');          // Change if needed
define('DB_PASS', 'PASSWORD');      // CHANGE THIS!
\`\`\`

### Step 2: Create Database
\`\`\`bash
mysql -u root -p < database/schema.sql
\`\`\`

### Step 3: University Info (OPTIONAL)
If you want to change from "Agriculture University Tando Jam":

**In `index.html`:**
Find:
\`\`\`html
<p class="text-muted">Agriculture University Tando Jam, Sindh, Pakistan</p>
\`\`\`
Replace with:
\`\`\`html
<p class="text-muted">YOUR UNIVERSITY NAME</p>
\`\`\`

### Step 4: Email Addresses (OPTIONAL)
Update these if needed:

**In `index.html`:**
\`\`\`html
<!-- Find and replace -->
admin@autandojam.edu.pk → your@email.com
\`\`\`

**In `database/schema.sql`:**
\`\`\`sql
-- Find and replace before importing
admin@autandojam.edu.pk → your@email.com
\`\`\`

### Step 5: Admin Password (OPTIONAL)
Default is `admin123`. To change:

\`\`\`bash
# Generate new password hash
php -r "echo password_hash('mynewpassword', PASSWORD_BCRYPT);"

# This will print something like:
# $2y$10$abcdefghijklmnopqrstuvwxyz...

# Copy that hash and update database/schema.sql before importing
\`\`\`

---

## Simplest Setup (No Changes Needed)

If you just want to get it running immediately:

1. **Update only these 3 values** in `config/database.php`:
\`\`\`php
define('DB_HOST', 'localhost');      // Usually OK
define('DB_USER', 'root');           // Usually OK
define('DB_PASS', 'YOUR_MYSQL_PASSWORD');  // MUST change this!
\`\`\`

2. **Import database:**
\`\`\`bash
mysql -u root -p < database/schema.sql
\`\`\`

3. **Start server:**
\`\`\`bash
php -S localhost:8000
\`\`\`

4. **Login with:**
   - Username: `admin`
   - Password: `admin123`

Everything else will work as-is!

---

## Verification Checklist

After replacing placeholders:

- [ ] Database credentials work (`config/database.php`)
- [ ] Database imported successfully
- [ ] Can connect to database from PHP
- [ ] Can login with admin account
- [ ] Dashboard loads without errors
- [ ] Can add/edit/delete items
- [ ] Charts display correctly

---

## Need Help?

If something doesn't work:

1. **Check database connection:**
   \`\`\`bash
   mysql -u YOUR_USER -p YOUR_PASSWORD inventory_system
   SELECT * FROM users;
   \`\`\`

2. **Check PHP errors:**
   - Open browser console (F12)
   - Check Application → Network tab
   - Look for red error messages

3. **Check MySQL errors:**
   \`\`\`bash
   mysql -u root -p < database/schema.sql
   # Look for error messages
   \`\`\`

---

**That's it! You're ready to use the system.**
