-- =====================================================
-- University Inventory Management System
-- Agriculture University Tando Jam, Sindh
-- =====================================================

CREATE DATABASE IF NOT EXISTS inventory_system;
USE inventory_system;

-- =====================================================
-- USERS TABLE (Admin/Staff Authentication)
-- =====================================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'staff', 'viewer') DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_category_name (category_name)
);

-- =====================================================
-- INVENTORY ITEMS TABLE (CORE)
-- =====================================================
CREATE TABLE inventory_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(150) NOT NULL,
    category_id INT NOT NULL,
    description TEXT,
    quantity INT NOT NULL DEFAULT 0,
    unit_of_measure VARCHAR(50) DEFAULT 'pieces',
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_value DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    min_stock_level INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_item_name (item_name),
    INDEX idx_is_active (is_active),
    FULLTEXT INDEX ft_search (item_name, description)
);

-- =====================================================
-- TRANSACTIONS TABLE (Stock In/Out)
-- =====================================================
CREATE TABLE transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    transaction_type ENUM('in', 'out', 'adjustment', 'damage') NOT NULL,
    quantity INT NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_item (item_id),
    INDEX idx_date (created_at),
    INDEX idx_type (transaction_type)
);

-- =====================================================
-- ACTIVITY LOG TABLE (Audit Trail)
-- =====================================================
CREATE TABLE activity_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_date (created_at),
    INDEX idx_action (action)
);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Default Admin User (username: admin, password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) 
VALUES ('admin', 'admin@autandojam.edu.pk', '$2y$10$YourHashedPasswordHere', 'System Administrator', 'admin');

-- Default Categories
INSERT INTO categories (category_name, description, created_by) 
VALUES 
('Seeds', 'Agricultural seeds and seedlings', 1),
('Fertilizers', 'Organic and chemical fertilizers', 1),
('Tools & Equipment', 'Farm tools and machinery', 1),
('Pesticides', 'Pest control chemicals', 1),
('Machinery Parts', 'Replacement parts for farm equipment', 1);
