<?php
require_once '../config/database.php';
require_once '../config/functions.php';

setJsonHeader();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// LOGIN
if ($method === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $username = sanitize($data['username'] ?? '');
    $password = $data['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        respond(['error' => 'Username and password required'], 400);
    }
    
    $query = "SELECT user_id, username, email, password_hash, full_name, role FROM users 
              WHERE username = ? AND is_active = TRUE";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (verifyPassword($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['full_name'] = $user['full_name'];
            
            logActivity($conn, 'LOGIN', 'user', $user['user_id']);
            
            respond(['success' => true, 'message' => 'Login successful', 'user' => $user]);
        }
    }
    respond(['error' => 'Invalid credentials'], 401);
}

// LOGOUT
if ($action === 'logout') {
    logActivity($conn, 'LOGOUT', 'user', $_SESSION['user_id'] ?? null);
    session_destroy();
    respond(['success' => true, 'message' => 'Logged out']);
}

// GET CURRENT USER
if ($action === 'current') {
    if (!isLoggedIn()) {
        respond(['error' => 'Not authenticated'], 401);
    }
    respond(['user' => ['user_id' => $_SESSION['user_id'], 'username' => $_SESSION['username'], 'role' => $_SESSION['role']]]);
}

respond(['error' => 'Invalid request'], 400);
?>
