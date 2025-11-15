// API Configuration
const API_BASE = 'api';

// Global State
let currentUser = null;
let allItems = [];
let currentPage = 1;
let currentSearch = '';
let currentCategory = '';
let chartInstances = {};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
});

function checkAuthStatus() {
    fetch(`${API_BASE}/auth.php?action=current`, {
        credentials: 'include'
    })
    .then(r => r.json())
    .then(data => {
        if (data.user) {
            currentUser = data.user;
            showDashboard();
        } else {
            showLogin();
        }
    })
    .catch(() => showLogin());
}

function showLogin() {
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('dashboardPage').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'block';
    
    document.getElementById('userDisplay').textContent = `${currentUser.username} (${currentUser.role})`;
    
    // Show/hide admin tab based on role
    if (currentUser.role !== 'admin') {
        document.getElementById('adminTab').style.display = 'none';
    }
    
    loadDashboardData();
    loadCategories();
    loadInventoryItems();
}

// Event Listeners
function setupEventListeners() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Inventory
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('categoryFilter').addEventListener('change', handleCategoryFilter);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    
    // Item Form
    document.getElementById('itemForm').addEventListener('submit', handleItemSubmit);
    document.getElementById('resetBtn').addEventListener('click', resetItemForm);
    document.getElementById('deleteBtn').addEventListener('click', handleDeleteItem);
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    fetch(`${API_BASE}/auth.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user;
            showDashboard();
            document.getElementById('loginForm').reset();
        } else {
            alert('Login failed: ' + data.error);
        }
    });
}

function handleLogout() {
    fetch(`${API_BASE}/auth.php?action=logout`, {
        credentials: 'include'
    })
    .then(() => {
        currentUser = null;
        showLogin();
    });
}

// Dashboard
function loadDashboardData() {
    fetch(`${API_BASE}/items.php?action=list&limit=1000`, { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            allItems = data.items;
            updateDashboardStats();
            renderCategoryChart();
            renderTopItems();
            renderLowStockReport();
        }
    });
}

function updateDashboardStats() {
    const totalValue = allItems.reduce((sum, item) => sum + parseFloat(item.total_value || 0), 0);
    const lowStock = allItems.filter(item => item.quantity <= item.min_stock_level).length;
    const categories = new Set(allItems.map(item => item.category_id)).size;
    
    document.getElementById('totalItems').textContent = allItems.length;
    document.getElementById('totalValue').textContent = `PKR ${totalValue.toLocaleString('en-PK', {maximumFractionDigits: 0})}`;
    document.getElementById('lowStockCount').textContent = lowStock;
    document.getElementById('categoryCount').textContent = categories;
}

// Categories
function loadCategories() {
    fetch(`${API_BASE}/categories.php`, { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.categories) {
            const categorySelect = document.getElementById('itemCategory');
            const categoryFilter = document.getElementById('categoryFilter');
            
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            
            data.categories.forEach(cat => {
                categorySelect.innerHTML += `<option value="${cat.category_id}">${cat.category_name}</option>`;
                categoryFilter.innerHTML += `<option value="${cat.category_id}">${cat.category_name}</option>`;
            });
        }
    });
}

// Inventory Items
function loadInventoryItems(page = 1) {
    currentPage = page;
    
    const url = new URL(`${API_BASE}/items.php?action=list`, window.location.origin);
    url.searchParams.append('page', page);
    url.searchParams.append('limit', 10);
    if (currentSearch) url.searchParams.append('search', currentSearch);
    if (currentCategory) url.searchParams.append('category_id', currentCategory);
    
    fetch(url, { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            renderItemsTable(data.items);
            renderPagination(data.pagination);
        }
    });
}

function renderItemsTable(items) {
    const tbody = document.getElementById('itemsTableBody');
    tbody.innerHTML = '';
    
    items.forEach(item => {
        const status = item.quantity <= item.min_stock_level ? 'warning' : 'success';
        const statusText = item.quantity <= item.min_stock_level ? 'Low Stock' : 'In Stock';
        
        tbody.innerHTML += `
            <tr>
                <td>${item.item_name}</td>
                <td>${item.category_name}</td>
                <td>${item.quantity} ${item.unit_of_measure}</td>
                <td>PKR ${parseFloat(item.unit_price).toLocaleString('en-PK')}</td>
                <td>PKR ${parseFloat(item.total_value).toLocaleString('en-PK', {maximumFractionDigits: 0})}</td>
                <td><span class="badge badge-${status}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="editItem(${item.item_id})">Edit</button>
                </td>
            </tr>
        `;
    });
}

function renderPagination(pag) {
    const nav = document.getElementById('paginationNav');
    nav.innerHTML = '';
    
    if (pag.pages <= 1) return;
    
    for (let i = 1; i <= pag.pages; i++) {
        const btn = document.createElement('button');
        btn.className = `btn btn-sm ${i === pag.page ? 'btn-primary' : 'btn-outline-primary'} mx-1`;
        btn.textContent = i;
        btn.onclick = () => loadInventoryItems(i);
        nav.appendChild(btn);
    }
}

function handleSearch(e) {
    currentSearch = e.target.value;
    loadInventoryItems(1);
}

function handleCategoryFilter(e) {
    currentCategory = e.target.value;
    loadInventoryItems(1);
}

// Item Form
function resetItemForm() {
    document.getElementById('itemId').value = '';
    document.getElementById('itemForm').reset();
    document.getElementById('formTitle').textContent = 'Add New Item';
    document.getElementById('deleteBtn').style.display = 'none';
    document.getElementById('submitBtn').textContent = 'Save Item';
}

function editItem(itemId) {
    const item = allItems.find(i => i.item_id == itemId);
    if (!item) return;
    
    document.getElementById('itemId').value = item.item_id;
    document.getElementById('itemName').value = item.item_name;
    document.getElementById('itemCategory').value = item.category_id;
    document.getElementById('itemDescription').value = item.description;
    document.getElementById('itemQuantity').value = item.quantity;
    document.getElementById('itemPrice').value = item.unit_price;
    document.getElementById('itemMinStock').value = item.min_stock_level;
    
    document.getElementById('formTitle').textContent = 'Edit Item';
    document.getElementById('deleteBtn').style.display = 'inline-block';
    document.getElementById('submitBtn').textContent = 'Update Item';
    
    // Scroll to form
    document.getElementById('addItemTab').click();
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function handleItemSubmit(e) {
    e.preventDefault();
    
    if (currentUser.role !== 'admin') {
        alert('Only admins can modify items');
        return;
    }
    
    const itemId = document.getElementById('itemId').value;
    const data = {
        item_id: itemId,
        item_name: document.getElementById('itemName').value,
        category_id: document.getElementById('itemCategory').value,
        description: document.getElementById('itemDescription').value,
        quantity: document.getElementById('itemQuantity').value,
        unit_price: document.getElementById('itemPrice').value,
        min_stock_level: document.getElementById('itemMinStock').value
    };
    
    const url = itemId ? `${API_BASE}/items.php?action=update` : `${API_BASE}/items.php?action=create`;
    const method = itemId ? 'PUT' : 'POST';
    
    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            resetItemForm();
            loadDashboardData();
            loadInventoryItems(1);
        } else {
            alert('Error: ' + data.error);
        }
    });
}

function handleDeleteItem() {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const itemId = document.getElementById('itemId').value;
    
    fetch(`${API_BASE}/items.php?action=delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId }),
        credentials: 'include'
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            resetItemForm();
            loadDashboardData();
            loadInventoryItems(1);
        }
    });
}

// Charts
function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    const categoryData = {};
    allItems.forEach(item => {
        categoryData[item.category_name] = (categoryData[item.category_name] || 0) + item.quantity;
    });
    
    if (chartInstances.categoryChart) {
        chartInstances.categoryChart.destroy();
    }
    
    chartInstances.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#0891b2']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

function renderTopItems() {
    const list = document.getElementById('topItemsList');
    const top5 = allItems.sort((a, b) => b.total_value - a.total_value).slice(0, 5);
    
    list.innerHTML = top5.map(item => `
        <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
            <span>${item.item_name}</span>
            <strong>PKR ${parseFloat(item.total_value).toLocaleString('en-PK', {maximumFractionDigits: 0})}</strong>
        </div>
    `).join('');
}

function renderLowStockReport() {
    const list = document.getElementById('lowStockList');
    const lowStock = allItems.filter(item => item.quantity <= item.min_stock_level);
    
    list.innerHTML = lowStock.length > 0 ? lowStock.map(item => `
        <div class="alert alert-warning mb-2">
            <strong>${item.item_name}</strong><br>
            Current: ${item.quantity} | Min: ${item.min_stock_level} | Category: ${item.category_name}
        </div>
    `).join('') : '<p class="text-muted">No items with low stock</p>';
}

// Export to CSV
function exportToCSV() {
    let csv = 'Item Name,Category,Quantity,Unit Price,Total Value,Status\n';
    
    allItems.forEach(item => {
        const status = item.quantity <= item.min_stock_level ? 'Low Stock' : 'In Stock';
        csv += `"${item.item_name}","${item.category_name}",${item.quantity},"PKR ${item.unit_price}","PKR ${item.total_value}","${status}"\n`;
    });
    
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
