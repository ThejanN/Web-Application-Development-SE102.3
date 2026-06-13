// AuraTech - Admin Dashboard Manager

let allProducts = [];
let allMessages = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initTabEvents();
    initLoginEvent();
    initLogoutEvent();
    initCrudEvents();
});

// ==========================================
// AUTHENTICATION CHECK
// ==========================================
function checkAuth() {
    const token = localStorage.getItem('aura-admin-token');
    const username = localStorage.getItem('aura-admin-user');
    
    const loginContainer = document.getElementById('login-container');
    const dashboardPanel = document.getElementById('dashboard-panel');
    const sessionUserSpan = document.getElementById('admin-session-user');

    if (token && username) {
        // Authenticated
        loginContainer.style.display = 'none';
        dashboardPanel.style.display = 'block';
        sessionUserSpan.textContent = username;
        loadDashboardData();
    } else {
        // Not Authenticated
        loginContainer.style.display = 'flex';
        dashboardPanel.style.display = 'none';
    }
}

function initLoginEvent() {
    const loginForm = document.getElementById('admin-login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('aura-admin-token', data.token);
                localStorage.setItem('aura-admin-user', data.username);
                showToast('Welcome back, Admin!', 'success');
                loginForm.reset();
                checkAuth();
            } else {
                showToast(data.error || 'Authentication failed', 'error');
            }
        } catch (err) {
            console.error('Login error:', err);
            showToast('Network error, server could be offline.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        }
    });
}

function initLogoutEvent() {
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('aura-admin-token');
        localStorage.removeItem('aura-admin-user');
        showToast('Logged out successfully', 'success');
        checkAuth();
    });
}

// ==========================================
// TAB CONTROL BINDINGS
// ==========================================
function initTabEvents() {
    const tabContainer = document.querySelector('.admin-tabs');
    if (!tabContainer) return;

    tabContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;

        tabContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tabId = btn.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === tabId) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    });
}

// ==========================================
// LOAD DASHBOARD METRICS & TABLES
// ==========================================
async function loadDashboardData() {
    await Promise.all([
        fetchProducts(),
        fetchMessages()
    ]);
    calculateStats();
}

async function fetchProducts() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    try {
        const res = await fetch('/api/products');
        allProducts = await res.json();
        renderProductsTable(allProducts, tbody);
    } catch (err) {
        console.error('Error fetching admin products:', err);
        showToast('Error fetching products list', 'error');
    }
}

async function fetchMessages() {
    const listContainer = document.getElementById('admin-messages-list');
    if (!listContainer) return;

    try {
        const res = await fetch('/api/messages');
        allMessages = await res.json();
        renderMessagesList(allMessages, listContainer);
    } catch (err) {
        console.error('Error fetching admin messages:', err);
        showToast('Error loading inbox messages', 'error');
    }
}

function calculateStats() {
    const totalProducts = allProducts.length;
    const totalMessages = allMessages.length;
    const lowStockItems = allProducts.filter(p => p.stock <= 5).length;

    document.getElementById('stat-products-count').textContent = totalProducts;
    document.getElementById('stat-messages-count').textContent = totalMessages;
    document.getElementById('stat-low-stock-count').textContent = lowStockItems;
}

// ==========================================
// RENDER DATA TABLE & MESSAGES LIST
// ==========================================
function renderProductsTable(products, tbody) {
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No products found in the database.</td></tr>';
        return;
    }

    products.forEach(product => {
        let stockClass = 'instock';
        if (product.stock === 0) stockClass = 'outstock';
        else if (product.stock <= 5) stockClass = 'lowstock';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img class="table-img" src="${product.image}" alt="${product.name}"></td>
            <td style="font-weight: 600; color: var(--text-primary);">${product.name}</td>
            <td>${product.category}</td>
            <td style="font-weight: 700; color: var(--accent-cyan);">$${product.price.toFixed(2)}</td>
            <td><span class="stock-badge ${stockClass}">${product.stock} units</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit edit-product-btn" data-id="${product.id}" title="Edit Product Info">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete delete-product-btn" data-id="${product.id}" title="Delete Product">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderMessagesList(messages, container) {
    container.innerHTML = '';

    if (messages.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                <i class="fas fa-inbox" style="font-size: 2.5rem; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>Mailbox is empty. No customer inquiries submitted yet.</p>
            </div>
        `;
        return;
    }

    messages.forEach(msg => {
        const date = new Date(msg.created_at).toLocaleString();
        const card = document.createElement('div');
        card.className = 'admin-msg-card';
        card.innerHTML = `
            <div class="msg-header">
                <div class="msg-sender">
                    <h4>${msg.name}</h4>
                    <p><i class="fas fa-envelope" style="margin-right: 6px;"></i>${msg.email}</p>
                </div>
                <div class="msg-date">${date}</div>
            </div>
            <div style="margin-bottom: 12px;"><strong>Subject:</strong> ${msg.subject || 'No Subject'}</div>
            <div class="msg-body">${msg.message}</div>
            <div class="msg-actions">
                <button class="btn btn-secondary delete-msg-btn" data-id="${msg.id}" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--error); color: var(--error);">
                    Delete Inquiry <i class="fas fa-trash-alt" style="margin-left: 6px;"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==========================================
// DML (CREATE, UPDATE, DELETE) & CRUD
// ==========================================
function initCrudEvents() {
    const modal = document.getElementById('product-form-modal');
    const openBtn = document.getElementById('open-add-product-modal');
    const closeBtn = document.getElementById('close-product-form-modal');
    const cancelBtn = document.getElementById('cancel-product-form');
    const form = document.getElementById('product-upsert-form');

    const openModal = () => modal.classList.add('open');
    const closeModal = () => {
        modal.classList.remove('open');
        form.reset();
        document.getElementById('form-product-id').value = '';
    };

    if (openBtn) openBtn.addEventListener('click', () => {
        document.getElementById('modal-form-title').textContent = 'Add New Product Creation';
        document.getElementById('save-product-form').textContent = 'Create Product';
        openModal();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Form Submit Event (Add/Edit Product)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('form-product-id').value;
            const name = document.getElementById('form-product-name').value.trim();
            const price = parseFloat(document.getElementById('form-product-price').value);
            const stock = parseInt(document.getElementById('form-product-stock').value);
            const category = document.getElementById('form-product-category').value;
            let image = document.getElementById('form-product-image').value.trim();
            const description = document.getElementById('form-product-desc').value.trim();

            if (!image) {
                // Seed fallback depending on category
                image = 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=600&q=80';
            }

            const payload = { name, price, stock, category, image, description };
            
            const submitBtn = document.getElementById('save-product-form');
            const originalText = submitBtn.textContent;

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving Changes...';

                let response;
                if (id) {
                    // DML UPDATE
                    response = await fetch(`/api/products/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    // DML INSERT
                    response = await fetch('/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                const data = await response.json();

                if (response.ok) {
                    showToast(id ? 'Product updated successfully' : 'Product created successfully', 'success');
                    closeModal();
                    loadDashboardData();
                } else {
                    showToast(data.error || 'DML operation failed', 'error');
                }
            } catch (err) {
                console.error('Error saving product:', err);
                showToast('Network error, unable to connect to server.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Dynamic click triggers on table/list elements (Edit / Delete buttons)
    document.addEventListener('click', (e) => {
        // EDIT product trigger
        const editBtn = e.target.closest('.edit-product-btn');
        if (editBtn) {
            const id = parseInt(editBtn.dataset.id);
            const product = allProducts.find(p => p.id === id);
            if (product) {
                document.getElementById('modal-form-title').textContent = 'Edit Product Details';
                document.getElementById('save-product-form').textContent = 'Save Changes';
                
                document.getElementById('form-product-id').value = product.id;
                document.getElementById('form-product-name').value = product.name;
                document.getElementById('form-product-price').value = product.price;
                document.getElementById('form-product-stock').value = product.stock;
                document.getElementById('form-product-category').value = product.category;
                document.getElementById('form-product-image').value = product.image;
                document.getElementById('form-product-desc').value = product.description;
                
                openModal();
            }
        }

        // DELETE product trigger (DML DELETE)
        const deleteBtn = e.target.closest('.delete-product-btn');
        if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.id);
            const product = allProducts.find(p => p.id === id);
            if (product && confirm(`Are you sure you want to delete "${product.name}" from database catalog?`)) {
                deleteProduct(id);
            }
        }

        // DELETE contact message trigger (DML DELETE)
        const deleteMsgBtn = e.target.closest('.delete-msg-btn');
        if (deleteMsgBtn) {
            const id = parseInt(deleteMsgBtn.dataset.id);
            if (confirm('Are you sure you want to delete this customer inquiry?')) {
                deleteMessage(id);
            }
        }
    });
}

async function deleteProduct(id) {
    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (response.ok) {
            showToast('Product successfully removed from inventory', 'success');
            loadDashboardData();
        } else {
            showToast(data.error || 'Failed to delete product', 'error');
        }
    } catch (err) {
        console.error('Delete product error:', err);
        showToast('Network error, server could be offline.', 'error');
    }
}

async function deleteMessage(id) {
    try {
        const response = await fetch(`/api/messages/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (response.ok) {
            showToast('Inquiry deleted successfully', 'success');
            loadDashboardData();
        } else {
            showToast(data.error || 'Failed to delete inquiry', 'error');
        }
    } catch (err) {
        console.error('Delete message error:', err);
        showToast('Network error, server could be offline.', 'error');
    }
}
