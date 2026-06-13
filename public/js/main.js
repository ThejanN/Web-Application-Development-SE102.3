// AuraTech - Common Frontend Script

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    initCartDrawer();
    updateCartCountUI();
    
    // Header shadow on scroll
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
});

// ==========================================
// THEME MANAGER (Light/Dark Mode)
// ==========================================
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (!themeToggleBtn) return;

    // Read stored theme or default to dark
    const savedTheme = localStorage.getItem('aura-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme, themeToggleBtn);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('aura-theme', newTheme);
        updateThemeIcon(newTheme, themeToggleBtn);
        showToast(`Switched to ${newTheme} theme`, 'success');
    });
}

function updateThemeIcon(theme, button) {
    const icon = button.querySelector('i');
    if (!icon) return;
    if (theme === 'light') {
        icon.className = 'fas fa-moon';
    } else {
        icon.className = 'fas fa-sun';
    }
}

// ==========================================
// MOBILE MENU TOGGLE
// ==========================================
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        if (navLinks.style.display === 'flex') {
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = 'var(--header-height)';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.backgroundColor = 'var(--bg-secondary)';
            navLinks.style.padding = '24px';
            navLinks.style.borderBottom = '1px solid var(--border-glass)';
            navLinks.style.zIndex = '999';
        }
    });

    // Reset layout on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navLinks.removeAttribute('style');
        }
    });
}

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Fade out and remove toast after 3.5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

// ==========================================
// CART OPERATIONS & STATE (localStorage)
// ==========================================
function getCart() {
    return JSON.parse(localStorage.getItem('aura-cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('aura-cart', JSON.stringify(cart));
    updateCartCountUI();
    renderCartDrawer();
}

function addToCart(product) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCart(cart);
    showToast(`${product.name} added to cart`, 'success');
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    showToast('Item removed from cart', 'success');
}

function updateCartQuantity(productId, quantity) {
    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        saveCart(cart);
    }
}

function getCartCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function clearCart() {
    localStorage.removeItem('aura-cart');
    updateCartCountUI();
    renderCartDrawer();
}

function updateCartCountUI() {
    const cartCountBadge = document.querySelector('.cart-count');
    if (cartCountBadge) {
        const count = getCartCount();
        cartCountBadge.textContent = count;
        cartCountBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// ==========================================
// CART DRAWER DRAWER HANDLERS
// ==========================================
function initCartDrawer() {
    const cartBtn = document.getElementById('cart-btn');
    const closeBtn = document.getElementById('cart-close');
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!cartBtn || !drawer || !overlay) return;

    const openDrawer = () => {
        drawer.classList.add('open');
        overlay.classList.add('show');
        renderCartDrawer();
    };

    const closeDrawer = () => {
        drawer.classList.remove('open');
        overlay.classList.remove('show');
    };

    cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cart = getCart();
            if (cart.length === 0) {
                showToast('Your cart is empty', 'warning');
                return;
            }
            // Simple mock checkout
            showToast('Order processed successfully! Thank you for purchasing.', 'success');
            clearCart();
            closeDrawer();
        });
    }
}

function renderCartDrawer() {
    const cartItemsContainer = document.getElementById('cart-items-list');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    if (!cartItemsContainer || !cartTotalAmount) return;

    const cart = getCart();
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                <i class="fas fa-shopping-bag" style="font-size: 2.5rem; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>Your shopping bag is empty.</p>
            </div>
        `;
        cartTotalAmount.textContent = '$0.00';
        return;
    }

    cart.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img class="cart-item-img" src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.name}</h4>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div class="cart-item-qty">
                    <button class="qty-btn dec-qty" data-id="${item.id}">-</button>
                    <span class="qty-val">${item.quantity}</span>
                    <button class="qty-btn inc-qty" data-id="${item.id}">+</button>
                </div>
            </div>
            <button class="cart-item-remove remove-item-btn" data-id="${item.id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    cartTotalAmount.textContent = `$${getCartTotal().toFixed(2)}`;

    // Add event listeners to quantity buttons
    cartItemsContainer.querySelectorAll('.dec-qty').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const item = getCart().find(i => i.id === id);
            if (item) updateCartQuantity(id, item.quantity - 1);
        });
    });

    cartItemsContainer.querySelectorAll('.inc-qty').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const item = getCart().find(i => i.id === id);
            if (item) updateCartQuantity(id, item.quantity + 1);
        });
    });

    cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            removeFromCart(id);
        });
    });
}
