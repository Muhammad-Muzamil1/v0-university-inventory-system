<?php
require_once '../config/database.php';
require_once '../config/functions.php';

setJsonHeader();

if (!isLoggedIn()) {
    respond(['error' => 'Not authenticated'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET ALL CATEGORIES
if ($method === 'GET' && !$action) {
    $query = "SELECT * FROM categories ORDER BY category_name ASC";
    $result = $conn->query($query);
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
    
    respond(['success' => true, 'categories' => $categories]);
}

respond(['error' => 'Invalid request'], 400);
?>
