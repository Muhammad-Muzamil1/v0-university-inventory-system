<?php
// Core Functions & Helper Methods

// Start session if not started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set response headers for JSON API
function setJsonHeader() {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['user_id']) && isset($_SESSION['role']);
}

// Check user role (for authorization)
function hasRole($requiredRole) {
    if (!isLoggedIn()) return false;
    return $_SESSION['role'] === $requiredRole || $_SESSION['role'] === 'admin';
}

// Sanitize input
function sanitize($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// Validate email
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Hash password
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
}

// Verify password
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

// Log activity
function logActivity($conn, $action, $entity_type, $entity_id, $old_values = null, $new_values = null) {
    $user_id = $_SESSION['user_id'] ?? null;
    $ip_address = $_SERVER['REMOTE_ADDR'];
    
    $query = "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
              VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    if ($stmt) {
        $old_json = $old_values ? json_encode($old_values) : null;
        $new_json = $new_values ? json_encode($new_values) : null;
        $stmt->bind_param('ississs', $user_id, $action, $entity_type, $entity_id, $old_json, $new_json, $ip_address);
        $stmt->execute();
        $stmt->close();
    }
}

// Response helper
function respond($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Pagination helper
function getPaginationValues($page = 1, $limit = 10) {
    $page = max(1, intval($page));
    $limit = min(100, max(1, intval($limit)));
    $offset = ($page - 1) * $limit;
    return ['page' => $page, 'limit' => $limit, 'offset' => $offset];
}
?>
