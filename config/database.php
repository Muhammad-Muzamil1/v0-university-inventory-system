<?php
// Database Configuration File
// PLACEHOLDERS: Update these with your actual values

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'inventory_system');
define('DB_CHARSET', 'utf8mb4');

// API Configuration
define('API_TIMEOUT', 30);
define('MAX_FILE_SIZE', 5242880); // 5MB

// Session Configuration
define('SESSION_TIMEOUT', 1800); // 30 minutes

// Create Database Connection
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Database Connection Failed: " . $conn->connect_error);
    }
    
    // Set charset to UTF-8
    $conn->set_charset(DB_CHARSET);
    
} catch (Exception $e) {
    die(json_encode(['error' => $e->getMessage()]));
}
?>
