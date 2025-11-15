/**
 * Agriculture University Inventory Management System
 * Frontend Application Logic - ES6+ Modular JavaScript
 */

// ============ Configuration ============
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    TOKEN_KEY: 'inventory_token',
    USER_KEY: 'inventory_user',
};

// ============ Global State ============
let state = {
    user: null,
    token: null,
    currentPage: 'dashboard',
    inventory: [],
    categories: [],
    currentFilters: {
        search: '',
        categoryId: '',
        page: 1,
        limit: 10,
    },
};

// ============ Utility Functions ============
const showLoader = (show = true) => {
    document.getElementById('loading-spinner').style.display = show ? 'flex' : 'none';
};

const showMessage = (type, message, elementId = 'form-message') => {
    const element = document.getElementById(elementId);
    element.className = `alert alert-${type}`;
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
    }).format(value);
};

const formatDate = (date) => {
    return new Date(date).toLocaleString('en-PK');
};

// ============ API Request Handler ============
const apiRequest = async (endpoint, method = 'GET', data = null) => {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (state.token) {
            options.headers['Authorization'] = `Bearer ${state.token}`;
        }

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API request failed');
        }

        return result;
    } catch (error) {
        console.error('[API Error]', error);
        throw error;
    }
};

// ============ Authentication Functions ============
const login = async (username, password) => {
    try {
        showLoader(true);
        const response = await apiRequest('/auth/login', 'POST', { username, password });

        state.token = response.token;
        state.user = response.user;

        localStorage.setItem(CONFIG.TOKEN_KEY, response.token);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));

        showAuthUI(false);
        loadDashboard();
        initializeApp();

        return true;
    } catch (error) {
        showMessage('danger', error.message, 'auth-message');
        return false;
    } finally {
        showLoader(false);
    }
};

const logout = () => {
    state.token = null;
    state.user = null;
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);

    showAuthUI(true);
    document.getElementById('login-form').reset();
};

const restoreSession = () => {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    const user = localStorage.getItem(CONFIG.USER_KEY);

    if (token && user) {
        state.token = token;
        state.user = JSON.parse(user);
        showAuthUI(false);
        initializeApp();
        return true;
    }
    return false;
};

const showAuthUI = (show) => {
    document.getElementById('auth-container').style.display = show ? 'flex' : 'none';
    document.getElementById('main-container').style.display = show ? 'none' : 'block';
};

// ============ Page Navigation ============
const navigateTo = (page) => {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(el => {
        el.classList.remove('active');
    });

    // Show selected page
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
        pageElement.classList.add('active');
    }

    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    state.currentPage = page;

    // Load page data
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'reports':
            loadReports();
            break;
        case 'activity':
            loadActivityLog();
            break;
    }
};

// ============ Dashboard Functions ============
const loadDashboard = async () => {
    try {
        showLoader(true);

        // Fetch dashboard data
        const response = await apiRequest('/reports/dashboard');
        const data = response.data;

        // Update metrics
        document.getElementById('total-items').textContent = data.totalItems;
        document.getElementById('total-value').textContent = formatCurrency(data.totalValue);
        document.getElementById('low-stock-items').textContent = data.lowStockItems;
        document.getElementById('total-categories').textContent = data.categoryDistribution.length;

        // Render category chart
        renderCategoryChart(data.categoryDistribution);

        // Render value chart
        renderValueChart(data.categoryDistribution);

        // Render recent transactions
        renderRecentTransactions(data.recentTransactions);
    } catch (error) {
        console.error('Dashboard load error:', error);
    } finally {
        showLoader(false);
    }
};

const renderCategoryChart = (data) => {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;

    if (window.categoryChartInstance) {
        window.categoryChartInstance.destroy();
    }

    const labels = data.map(item => item.categoryName);
    const values = data.map(item => item.count);
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6', '#ec4899'];

    window.categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, values.length),
                borderColor: 'white',
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
            },
        },
    });
};

const renderValueChart = (data) => {
    const ctx = document.getElementById('value-chart');
    if (!ctx) return;

    if (window.valueChartInstance) {
        window.valueChartInstance.destroy();
    }

    const labels = data.map(item => item.categoryName);
    const values = data.map(item => item.value || 0);

    window.valueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Value (PKR)',
                data: values,
                backgroundColor: '#2563eb',
                borderRadius: 6,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
};

const renderRecentTransactions = (transactions) => {
    const tbody = document.getElementById('recent-transactions-body');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No transactions yet</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(tx => `
        <tr>
            <td><strong>${tx.itemName}</strong></td>
            <td><span class="badge badge-${tx.transactionType === 'add' ? 'success' : 'warning'}">${tx.transactionType.toUpperCase()}</span></td>
            <td>${tx.quantityChange}</td>
            <td>${formatDate(tx.createdAt)}</td>
        </tr>
    `).join('');
};

// ============ Inventory Functions ============
const loadInventory = async () => {
    try {
        showLoader(true);

        const response = await apiRequest(
            `/inventory?page=${state.currentFilters.page}&limit=${state.currentFilters.limit}&search=${state.currentFilters.search}&categoryId=${state.currentFilters.categoryId}`
        );

        state.inventory = response.data;
        renderInventoryTable(response.data);
        renderPagination(response.pagination, 'inventory-pagination', loadInventory);
    } catch (error) {
        console.error('Inventory load error:', error);
        showMessage('danger', 'Failed to load inventory');
    } finally {
        showLoader(false);
    }
};

const renderInventoryTable = (items) => {
    const tbody = document.getElementById('inventory-table-body');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No items found</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => {
        const isLowStock = item.quantity <= item.reorderLevel;
        const statusBadge = isLowStock
            ? '<span class="badge badge-warning">Low Stock</span>'
            : '<span class="badge badge-success">In Stock</span>';

        return `
            <tr>
                <td><strong>${item.itemName}</strong></td>
                <td>${item.categoryName}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td><strong>${formatCurrency(item.totalValue)}</strong></td>
                <td>${item.location || '-'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editItem(${item.itemId})">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${state.user.role === 'admin' ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(${item.itemId})">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
};

const renderPagination = (pagination, elementId, callback) => {
    const paginationEl = document.getElementById(elementId);
    paginationEl.innerHTML = '';

    if (pagination.pages <= 1) return;

    // Previous button
    if (pagination.page > 1) {
        paginationEl.innerHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="state.currentFilters.page = ${pagination.page - 1}; ${callback.name}(); return false;">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
    }

    // Page numbers
    for (let i = 1; i <= pagination.pages; i++) {
        paginationEl.innerHTML += `
            <li class="page-item ${i === pagination.page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="state.currentFilters.page = ${i}; ${callback.name}(); return false;">
                    ${i}
                </a>
            </li>
        `;
    }

    // Next button
    if (pagination.page < pagination.pages) {
        paginationEl.innerHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="state.currentFilters.page = ${pagination.page + 1}; ${callback.name}(); return false;">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
    }
};

// ============ Add/Edit Item Functions ============
const loadCategories = async () => {
    try {
        const response = await apiRequest('/categories');
        state.categories = response.data;

        // Update category filter
        const filterSelect = document.getElementById('category-filter');
        filterSelect.innerHTML = '<option value="">All Categories</option>' +
            state.categories.map(cat => `<option value="${cat.categoryId}">${cat.categoryName}</option>`).join('');

        // Update add item form
        const categorySelect = document.getElementById('item-category');
        categorySelect.innerHTML = '<option value="">Select category</option>' +
            state.categories.map(cat => `<option value="${cat.categoryId}">${cat.categoryName}</option>`).join('');

        // Update edit item form
        const editCategorySelect = document.getElementById('edit-item-category');
        editCategorySelect.innerHTML = state.categories.map(cat => `<option value="${cat.categoryId}">${cat.categoryName}</option>`).join('');
    } catch (error) {
        console.error('Categories load error:', error);
    }
};

const addItem = async (e) => {
    e.preventDefault();

    const itemData = {
        itemName: document.getElementById('item-name').value,
        categoryId: parseInt(document.getElementById('item-category').value),
        description: document.getElementById('item-description').value,
        quantity: parseInt(document.getElementById('item-quantity').value),
        unitPrice: parseFloat(document.getElementById('item-price').value),
        reorderLevel: parseInt(document.getElementById('item-reorder').value),
        location: document.getElementById('item-location').value,
        barcode: document.getElementById('item-barcode').value,
    };

    try {
        showLoader(true);
        await apiRequest('/inventory', 'POST', itemData);
        showMessage('success', 'Item added successfully!');
        document.getElementById('add-item-form').reset();
        navigateTo('inventory');
    } catch (error) {
        showMessage('danger', error.message);
    } finally {
        showLoader(false);
    }
};

const editItem = async (itemId) => {
    try {
        const response = await apiRequest(`/inventory/${itemId}`);
        const item = response.data;

        document.getElementById('edit-item-id').value = item.itemId;
        document.getElementById('edit-item-name').value = item.itemName;
        document.getElementById('edit-item-category').value = item.categoryId;
        document.getElementById('edit-item-barcode').value = item.barcode || '';
        document.getElementById('edit-item-quantity').value = item.quantity;
        document.getElementById('edit-item-price').value = item.unitPrice;
        document.getElementById('edit-item-reorder').value = item.reorderLevel;

        new bootstrap.Modal(document.getElementById('editItemModal')).show();
    } catch (error) {
        showMessage('danger', error.message);
    }
};

const saveEdit = async () => {
    const itemId = document.getElementById('edit-item-id').value;
    const itemData = {
        itemName: document.getElementById('edit-item-name').value,
        categoryId: parseInt(document.getElementById('edit-item-category').value),
        quantity: parseInt(document.getElementById('edit-item-quantity').value),
        unitPrice: parseFloat(document.getElementById('edit-item-price').value),
        reorderLevel: parseInt(document.getElementById('edit-item-reorder').value),
        barcode: document.getElementById('edit-item-barcode').value,
    };

    try {
        showLoader(true);
        await apiRequest(`/inventory/${itemId}`, 'PUT', itemData);
        bootstrap.Modal.getInstance(document.getElementById('editItemModal')).hide();
        showMessage('success', 'Item updated successfully!');
        loadInventory();
    } catch (error) {
        showMessage('danger', error.message, 'edit-form-message');
    } finally {
        showLoader(false);
    }
};

const deleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        showLoader(true);
        await apiRequest(`/inventory/${itemId}`, 'DELETE');
        showMessage('success', 'Item deleted successfully!');
        loadInventory();
    } catch (error) {
        showMessage('danger', error.message);
    } finally {
        showLoader(false);
    }
};

// ============ Reports Functions ============
const loadReports = async () => {
    try {
        showLoader(true);
        const response = await apiRequest('/reports/dashboard');
        const data = response.data;

        renderTopCategoriesChart(data.categoryDistribution);
        renderCategoryCountChart(data.categoryDistribution);
    } catch (error) {
        console.error('Reports load error:', error);
    } finally {
        showLoader(false);
    }
};

const renderTopCategoriesChart = (data) => {
    const ctx = document.getElementById('top-categories-chart');
    if (!ctx) return;

    if (window.topCategoriesChartInstance) {
        window.topCategoriesChartInstance.destroy();
    }

    const sortedData = [...data].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5);
    const labels = sortedData.map(item => item.categoryName);
    const values = sortedData.map(item => item.value || 0);

    window.topCategoriesChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9'],
                borderColor: 'white',
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
            },
        },
    });
};

const renderCategoryCountChart = (data) => {
    const ctx = document.getElementById('category-count-chart');
    if (!ctx) return;

    if (window.categoryCountChartInstance) {
        window.categoryCountChartInstance.destroy();
    }

    const labels = data.map(item => item.categoryName);
    const counts = data.map(item => item.count);

    window.categoryCountChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Number of Items',
                data: counts,
                backgroundColor: '#10b981',
                borderRadius: 6,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                    },
                },
            },
        },
    });
};

// ============ Activity Log Functions ============
const loadActivityLog = async () => {
    try {
        showLoader(true);
        const response = await apiRequest(`/reports/activity?page=1&limit=20`);

        renderActivityTable(response.data);
        renderPagination(response.pagination, 'activity-pagination', loadActivityLog);
    } catch (error) {
        console.error('Activity log error:', error);
        showMessage('danger', 'Failed to load activity log');
    } finally {
        showLoader(false);
    }
};

const renderActivityTable = (logs) => {
    const tbody = document.getElementById('activity-log-body');

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No activity yet</td></tr>';
        return;
    }

    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${log.firstName} ${log.lastName}</td>
            <td><span class="badge badge-primary">${log.action}</span></td>
            <td>${log.entityType}</td>
            <td>${formatDate(log.createdAt)}</td>
            <td><small class="text-muted">${JSON.stringify(log.details).substring(0, 50)}...</small></td>
        </tr>
    `).join('');
};

// ============ Export Functions ============
const exportCSV = async () => {
    try {
        showLoader(true);
        window.location.href = `${CONFIG.API_BASE_URL}/reports/export/csv`;
    } catch (error) {
        showMessage('danger', 'Failed to export CSV');
    } finally {
        showLoader(false);
    }
};

// ============ Event Listeners ============
const initializeEventListeners = () => {
    // Authentication
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        await login(username, password);
    });

    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Navigation
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });

    // Inventory
    document.getElementById('search-input').addEventListener('input', (e) => {
        state.currentFilters.search = e.target.value;
        state.currentFilters.page = 1;
        loadInventory();
    });

    document.getElementById('category-filter').addEventListener('change', (e) => {
        state.currentFilters.categoryId = e.target.value;
        state.currentFilters.page = 1;
        loadInventory();
    });

    document.getElementById('export-btn').addEventListener('click', exportCSV);
    document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
    document.getElementById('refresh-dashboard').addEventListener('click', loadDashboard);

    // Forms
    document.getElementById('add-item-form').addEventListener('submit', addItem);
    document.getElementById('save-edit-btn').addEventListener('click', saveEdit);
};

// ============ Initialize Application ============
const initializeApp = async () => {
    try {
        // Load initial data
        await loadCategories();
        
        // Update UI
        document.getElementById('user-display').textContent = state.user.firstName;
        
        if (state.user.role === 'admin') {
            document.getElementById('admin-menu').style.display = 'block';
        }

        // Load dashboard
        navigateTo('dashboard');
    } catch (error) {
        console.error('App initialization error:', error);
    }
};

// ============ Document Ready ============
document.addEventListener('DOMContentLoaded', () => {
    if (!restoreSession()) {
        showAuthUI(true);
    }
    initializeEventListeners();
});
