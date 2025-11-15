<?php
require_once '../config/database.php';
require_once '../config/functions.php';

setJsonHeader();

if (!isLoggedIn()) {
    respond(['error' => 'Not authenticated'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET ALL ITEMS (with search, filter, pagination)
if ($method === 'GET' && $action === 'list') {
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 10;
    $search = sanitize($_GET['search'] ?? '');
    $category_id = $_GET['category_id'] ?? null;
    
    $pag = getPaginationValues($page, $limit);
    
    $query = "SELECT ii.*, c.category_name FROM inventory_items ii
              JOIN categories c ON ii.category_id = c.category_id
              WHERE ii.is_active = TRUE";
    
    $params = [];
    $types = '';
    
    if (!empty($search)) {
        $query .= " AND (ii.item_name LIKE ? OR ii.description LIKE ?)";
        $search_term = "%$search%";
        $params[] = &$search_term;
        $params[] = &$search_term;
        $types .= 'ss';
    }
    
    if (!empty($category_id)) {
        $query .= " AND ii.category_id = ?";
        $params[] = &$category_id;
        $types .= 'i';
    }
    
    // Get total count
    $count_query = str_replace("SELECT ii.*, c.category_name", "SELECT COUNT(*) as total", $query);
    $count_stmt = $conn->prepare($count_query);
    if (!empty($params)) {
        $count_stmt->bind_param($types, ...$params);
    }
    $count_stmt->execute();
    $count_result = $count_stmt->get_result();
    $total = $count_result->fetch_assoc()['total'];
    
    $query .= " ORDER BY ii.updated_at DESC LIMIT ? OFFSET ?";
    $stmt = $conn->prepare($query);
    
    $params[] = &$pag['limit'];
    $params[] = &$pag['offset'];
    $types .= 'ii';
    
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    
    respond([
        'success' => true,
        'items' => $items,
        'pagination' => [
            'page' => $pag['page'],
            'limit' => $pag['limit'],
            'total' => $total,
            'pages' => ceil($total / $pag['limit'])
        ]
    ]);
}

// GET SINGLE ITEM
if ($method === 'GET' && $action === 'get') {
    $item_id = intval($_GET['item_id'] ?? 0);
    
    if ($item_id <= 0) {
        respond(['error' => 'Invalid item ID'], 400);
    }
    
    $query = "SELECT ii.*, c.category_name FROM inventory_items ii
              JOIN categories c ON ii.category_id = c.category_id
              WHERE ii.item_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $item_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        respond(['success' => true, 'item' => $result->fetch_assoc()]);
    }
    respond(['error' => 'Item not found'], 404);
}

// CREATE ITEM
if ($method === 'POST' && $action === 'create') {
    if (!hasRole('admin')) {
        respond(['error' => 'Unauthorized'], 403);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $item_name = sanitize($data['item_name'] ?? '');
    $category_id = intval($data['category_id'] ?? 0);
    $description = sanitize($data['description'] ?? '');
    $quantity = intval($data['quantity'] ?? 0);
    $unit_of_measure = sanitize($data['unit_of_measure'] ?? 'pieces');
    $unit_price = floatval($data['unit_price'] ?? 0);
    $min_stock_level = intval($data['min_stock_level'] ?? 10);
    $user_id = $_SESSION['user_id'];
    
    if (empty($item_name) || $category_id <= 0 || $unit_price < 0) {
        respond(['error' => 'Invalid input data'], 400);
    }
    
    $query = "INSERT INTO inventory_items (item_name, category_id, description, quantity, unit_of_measure, unit_price, min_stock_level, created_by, updated_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('siisisdii', $item_name, $category_id, $description, $quantity, $unit_of_measure, $unit_price, $min_stock_level, $user_id, $user_id);
    
    if ($stmt->execute()) {
        $item_id = $conn->insert_id;
        logActivity($conn, 'CREATE', 'item', $item_id, null, $data);
        respond(['success' => true, 'message' => 'Item created', 'item_id' => $item_id], 201);
    }
    respond(['error' => 'Failed to create item'], 500);
}

// UPDATE ITEM
if ($method === 'PUT' && $action === 'update') {
    if (!hasRole('admin')) {
        respond(['error' => 'Unauthorized'], 403);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $item_id = intval($data['item_id'] ?? 0);
    
    if ($item_id <= 0) {
        respond(['error' => 'Invalid item ID'], 400);
    }
    
    $item_name = sanitize($data['item_name'] ?? '');
    $category_id = intval($data['category_id'] ?? 0);
    $description = sanitize($data['description'] ?? '');
    $unit_price = floatval($data['unit_price'] ?? 0);
    $min_stock_level = intval($data['min_stock_level'] ?? 10);
    $user_id = $_SESSION['user_id'];
    
    $query = "UPDATE inventory_items SET item_name = ?, category_id = ?, description = ?, unit_price = ?, min_stock_level = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
              WHERE item_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sisidii', $item_name, $category_id, $description, $unit_price, $min_stock_level, $user_id, $item_id);
    
    if ($stmt->execute()) {
        logActivity($conn, 'UPDATE', 'item', $item_id, null, $data);
        respond(['success' => true, 'message' => 'Item updated']);
    }
    respond(['error' => 'Failed to update item'], 500);
}

// DELETE ITEM
if ($method === 'DELETE' && $action === 'delete') {
    if (!hasRole('admin')) {
        respond(['error' => 'Unauthorized'], 403);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $item_id = intval($data['item_id'] ?? 0);
    
    if ($item_id <= 0) {
        respond(['error' => 'Invalid item ID'], 400);
    }
    
    $query = "UPDATE inventory_items SET is_active = FALSE WHERE item_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $item_id);
    
    if ($stmt->execute()) {
        logActivity($conn, 'DELETE', 'item', $item_id);
        respond(['success' => true, 'message' => 'Item deleted']);
    }
    respond(['error' => 'Failed to delete item'], 500);
}

respond(['error' => 'Invalid request'], 400);
?>
