#!/bin/bash

# Quick Start Script for University Inventory System

clear

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   University Inventory Management System - Quick Start         ║"
echo "║   Agriculture University Tando Jam, Sindh, Pakistan           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if PHP is installed
echo "Checking prerequisites..."
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed"
    echo "Download from: https://www.php.net/downloads"
    exit 1
fi
echo "✓ PHP $(php -v | head -n1 | cut -d' ' -f2) detected"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed"
    echo "Download from: https://www.mysql.com/downloads/"
    exit 1
fi
echo "✓ MySQL detected"

echo ""
echo "─────────────────────────────────────────────────────────────────"
echo "STEP 1: Database Setup"
echo "─────────────────────────────────────────────────────────────────"
echo ""

read -p "Do you want to import the database schema? (y/n): " IMPORT_DB

if [ "$IMPORT_DB" = "y" ] || [ "$IMPORT_DB" = "Y" ]; then
    read -sp "Enter MySQL root password (leave blank if none): " MYSQL_PASS
    echo ""
    
    if [ -z "$MYSQL_PASS" ]; then
        mysql -u root < database/schema.sql
    else
        mysql -u root -p"$MYSQL_PASS" < database/schema.sql
    fi
    
    if [ $? -eq 0 ]; then
        echo "✓ Database imported successfully"
    else
        echo "❌ Failed to import database"
        exit 1
    fi
fi

echo ""
echo "─────────────────────────────────────────────────────────────────"
echo "STEP 2: Database Configuration"
echo "─────────────────────────────────────────────────────────────────"
echo ""

read -p "Enter MySQL Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter MySQL User [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Enter MySQL Password: " DB_PASS
echo ""

# Update config file
cat > config/database.php << EOF
<?php
define('DB_HOST', '$DB_HOST');
define('DB_USER', '$DB_USER');
define('DB_PASS', '$DB_PASS');
define('DB_NAME', 'inventory_system');
define('DB_CHARSET', 'utf8mb4');

try {
    \$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if (\$conn->connect_error) {
        throw new Exception("Database Connection Failed: " . \$conn->connect_error);
    }
    \$conn->set_charset(DB_CHARSET);
} catch (Exception \$e) {
    die(json_encode(['error' => \$e->getMessage()]));
}
?>
EOF

echo "✓ Configuration saved"

echo ""
echo "─────────────────────────────────────────────────────────────────"
echo "STEP 3: Starting Server"
echo "─────────────────────────────────────────────────────────────────"
echo ""

read -p "Enter Port Number [8000]: " PORT
PORT=${PORT:-8000}

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  SETUP COMPLETE! 🎉                                            ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║  Starting PHP Server...                                        ║"
echo "║  URL: http://localhost:$PORT                                    ║"
echo "║                                                                ║"
echo "║  Login Credentials:                                            ║"
echo "║  Username: admin                                               ║"
echo "║  Password: admin123                                            ║"
echo "║                                                                ║"
echo "║  Press Ctrl+C to stop the server                               ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

php -S localhost:$PORT
