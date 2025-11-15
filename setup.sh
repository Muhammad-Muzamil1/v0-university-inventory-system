#!/bin/bash

# =========================================
# University Inventory Management System
# Simple Setup Script
# =========================================

echo "=========================================="
echo "Inventory Management System - Setup"
echo "=========================================="
echo ""

# Create .env file
echo "Creating configuration file..."

cat > .env.php << 'EOF'
<?php
// SIMPLE CONFIGURATION FILE
// Update these values with your actual database credentials

// Database Credentials (UPDATE THESE!)
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'inventory_system');

// Application Settings
define('APP_NAME', 'University Inventory System');
define('APP_URL', 'http://localhost:8000');
define('DEBUG', true);
?>
EOF

echo "✓ Configuration file created: .env.php"
echo ""

# Create directory structure
echo "Creating directory structure..."
mkdir -p config api database

echo "✓ Directories created"
echo ""

# Instructions
echo "=========================================="
echo "SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Create MySQL Database:"
echo "   mysql -u root -p < database/schema.sql"
echo ""
echo "2. Update Database Credentials in config/database.php:"
echo "   - DB_HOST: localhost"
echo "   - DB_USER: your_mysql_user"
echo "   - DB_PASS: your_mysql_password"
echo ""
echo "3. Start PHP Server:"
echo "   php -S localhost:8000"
echo ""
echo "4. Open in Browser:"
echo "   http://localhost:8000"
echo ""
echo "5. Login with:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "=========================================="
