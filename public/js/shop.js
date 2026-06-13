// AuraTech - Shop Catalog Manager

let currentProducts = [];
let activeCategory = 'All';
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
    // Read category parameter from URL if exists
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
        activeCategory = categoryParam;
        updateActiveFilterUI(categoryParam);
    }

    loadProducts();
    initFilterEvents();
    initSearchEvents();
    initModalEvents();
});

// ==========================================
// API REQUEST - FETCH PRODUCTS
// ==========================================
async function loadProducts() {
    const container = document.getElementById('shop-products-container');
    if (!container) return;

    // Show loading skeleton
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px 0;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2.5rem; margin-bottom: 16px;"></i>
            <p>Fetching catalog items...</p>
        </div>
    `;

    const searchQuery = document.getElementById('shop-search').value.trim();
    let url = `/api/products?category=${activeCategory}`;
    if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
    }

    try {
        const response = await fetch(url);
        currentProducts = await response.json();
        
        renderProducts(currentProducts, container);
    } catch (err) {
        console.error('Failed to load products:', err);
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--error); padding: 50px 0;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; margin-bottom: 16px;"></i>
                <p>Failed to load products. Server might be offline.</p>
            </div>
        `;
    }
}

// ==========================================
// RENDER PRODUCTS GRID
// ==========================================
function renderProducts(products, container) {
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 60px 0;">
                <i class="fas fa-search-minus" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>No products found matching the criteria.</p>
            </div>
        `;
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-container view-details-trigger" data-id="${product.id}" style="cursor: pointer;">
                <span class="product-badge">${product.category}</span>
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <h3 class="product-title view-details-trigger" data-id="${product.id}" style="cursor: pointer; display: inline-block;">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-meta">
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn shop-add-btn" data-id="${product.id}" aria-label="Add ${product.name} to cart">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // Wire up Add to Cart buttons
    container.querySelectorAll('.shop-add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const product = products.find(p => p.id === id);
            if (product) addToCart(product);
        });
    });

    // Wire up View Details click
    container.querySelectorAll('.view-details-trigger').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.dataset.id);
            const product = products.find(p => p.id === id);
            if (product) openProductModal(product);
        });
    });
}

// ==========================================
// FILTERS & SEARCH EVENT BINDERS
// ==========================================
function initFilterEvents() {
    const filtersContainer = document.getElementById('category-filters');
    if (!filtersContainer) return;

    filtersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;

        // Toggle Active Class
        filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        activeCategory = btn.dataset.category;
        loadProducts();
    });
}

function updateActiveFilterUI(category) {
    const filtersContainer = document.getElementById('category-filters');
    if (!filtersContainer) return;
    
    filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function initSearchEvents() {
    const searchInput = document.getElementById('shop-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        // Debounce input requests
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadProducts();
        }, 300);
    });
}

// ==========================================
// PRODUCT DETAIL POPUP MODAL
// ==========================================
function initModalEvents() {
    const modal = document.getElementById('product-detail-modal');
    const closeBtn = document.getElementById('close-detail-modal');
    if (!modal || !closeBtn) return;

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('open');
        }
    });
}

function openProductModal(product) {
    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;

    document.getElementById('modal-product-img').src = product.image;
    document.getElementById('modal-product-img').alt = product.name;
    document.getElementById('modal-product-category').textContent = product.category;
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-desc').textContent = product.description;
    document.getElementById('modal-product-price').textContent = `$${product.price.toFixed(2)}`;

    // Set stock badge status
    const stockEl = document.getElementById('modal-product-stock');
    if (product.stock > 10) {
        stockEl.textContent = `In Stock (${product.stock})`;
        stockEl.className = 'stock-badge instock';
    } else if (product.stock > 0) {
        stockEl.textContent = `Low Stock (${product.stock})`;
        stockEl.className = 'stock-badge lowstock';
    } else {
        stockEl.textContent = 'Out of Stock';
        stockEl.className = 'stock-badge outstock';
    }

    // Set Add to Cart action inside modal
    const modalAddBtn = document.getElementById('modal-add-to-cart');
    
    // Clear old listeners by cloning node
    const newAddBtn = modalAddBtn.cloneNode(true);
    modalAddBtn.replaceWith(newAddBtn);
    
    if (product.stock <= 0) {
        newAddBtn.disabled = true;
        newAddBtn.textContent = 'Out of Stock';
    } else {
        newAddBtn.disabled = false;
        newAddBtn.innerHTML = 'Add to Bag <i class="fas fa-shopping-bag" style="margin-left: 6px;"></i>';
        newAddBtn.addEventListener('click', () => {
            addToCart(product);
            modal.classList.remove('open');
        });
    }

    modal.classList.add('open');
}
