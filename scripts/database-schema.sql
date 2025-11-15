-- Agriculture University Tando Jam - Inventory Management System
-- Production-Grade SQL Schema

CREATE DATABASE IF NOT EXISTS `university_inventory` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `university_inventory`;

-- Users table with role-based access control
CREATE TABLE `users` (
  `userId` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `firstName` VARCHAR(100) NOT NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'staff', 'viewer') DEFAULT 'staff',
  `department` VARCHAR(100),
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table
CREATE TABLE `categories` (
  `categoryId` INT AUTO_INCREMENT PRIMARY KEY,
  `categoryName` VARCHAR(100) UNIQUE NOT NULL,
  `description` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_categoryName (categoryName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Items table
CREATE TABLE `inventory_items` (
  `itemId` INT AUTO_INCREMENT PRIMARY KEY,
  `itemName` VARCHAR(150) NOT NULL,
  `categoryId` INT NOT NULL,
  `description` TEXT,
  `quantity` INT NOT NULL DEFAULT 0,
  `unitPrice` DECIMAL(10, 2) NOT NULL,
  `totalValue` DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unitPrice) STORED,
  `reorderLevel` INT DEFAULT 10,
  `location` VARCHAR(100),
  `barcode` VARCHAR(50) UNIQUE,
  `addedBy` INT NOT NULL,
  `lastUpdatedBy` INT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES categories(categoryId) ON DELETE CASCADE,
  FOREIGN KEY (addedBy) REFERENCES users(userId),
  FOREIGN KEY (lastUpdatedBy) REFERENCES users(userId),
  INDEX idx_itemName (itemName),
  INDEX idx_categoryId (categoryId),
  INDEX idx_quantity (quantity),
  INDEX idx_totalValue (totalValue),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Log table for audit trail
CREATE TABLE `activity_logs` (
  `logId` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `entityType` VARCHAR(50),
  `entityId` INT,
  `details` JSON,
  `ipAddress` VARCHAR(45),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(userId),
  INDEX idx_userId (userId),
  INDEX idx_action (action),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock Transactions table for tracking
CREATE TABLE `stock_transactions` (
  `transactionId` INT AUTO_INCREMENT PRIMARY KEY,
  `itemId` INT NOT NULL,
  `transactionType` ENUM('add', 'remove', 'adjust') NOT NULL,
  `quantityChange` INT NOT NULL,
  `reason` VARCHAR(255),
  `performedBy` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itemId) REFERENCES inventory_items(itemId) ON DELETE CASCADE,
  FOREIGN KEY (performedBy) REFERENCES users(userId),
  INDEX idx_itemId (itemId),
  INDEX idx_transactionType (transactionType),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories
INSERT INTO `categories` (categoryName, description) VALUES
('Equipment', 'Agricultural equipment and machinery'),
('Seeds', 'Various crop seeds and seedlings'),
('Fertilizers', 'Organic and chemical fertilizers'),
('Pesticides', 'Pest control and insecticide products'),
('Tools', 'Hand tools and small equipment'),
('Lab Supplies', 'Laboratory testing and analysis materials'),
('Vehicles', 'University vehicles and transportation');

-- Insert sample admin user (password should be hashed in production)
-- Password example: admin123 (hashed with bcrypt)
INSERT INTO `users` (username, email, password, firstName, lastName, role, department, isActive) VALUES
('admin', 'admin@agri-tando.edu.pk', '$2b$10$YourHashedPasswordHere', 'Admin', 'User', 'admin', 'Administration', TRUE);
