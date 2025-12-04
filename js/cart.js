import { CONFIG } from './config.js';
import { showNotification, formatPrice } from './utils.js';

export function initCart() {
    const cartList = document.querySelector('.cart-items-list');
    
    // Se estiver na página do carrinho
    if (cartList) {
        renderCartPage(cartList);
    }
}

// Função chamada pelo gameGrid (em games.js)
export function addToCart(btn) {
    const card = btn.closest('.game-card');
    if(card.classList.contains('locked')) return;

    const select = card.querySelector('.license-select');
    const selectedOption = select.options[select.selectedIndex];
    
    const item = {
        id: btn.dataset.id,
        cartId: Date.now(),
        title: btn.dataset.title,
        imageSrc: btn.dataset.img,
        licenseType: selectedOption.value,
        licenseLabel: selectedOption.text.split(' (')[0],
        price: parseFloat(selectedOption.dataset.price)
    };

    let cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
    cart.push(item);
    localStorage.setItem(CONFIG.localStorageCartKey, JSON.stringify(cart));
    
    updateCartCount();
    showNotification(`"${item.title}" adicionado!`);
}

export function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
    const el = document.getElementById('cart-count');
    if (el) el.textContent = cart.length;
}

function renderCartPage(cartList) {
    const cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
    const totalEl = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        cartList.innerHTML = '<p class="empty-cart-msg">Seu carrinho está vazio.</p>';
        if(totalEl) totalEl.textContent = 'R$ 0,00';
    } else {
        let total = 0;
        cartList.innerHTML = '';
        cart.forEach(item => {
            total += item.price;
            cartList.innerHTML += `
                <div class="cart-item">
                    <img src="${item.imageSrc}" alt="${item.title}">
                    <div class="cart-item-info">
                        <h4>${item.title}</h4>
                        <div class="cart-item-meta">
                            <span class="license-tag">${item.licenseLabel}</span>
                            <span class="item-price">${formatPrice(item.price)}</span>
                        </div>
                    </div>
                    <button class="remove-item-btn" data-cart-id="${item.cartId}" aria-label="Remover">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
        });
        if(totalEl) totalEl.textContent = formatPrice(total);

        // Adiciona listeners de remoção
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idToRemove = parseInt(btn.dataset.cartId);
                const newCart = cart.filter(i => i.cartId !== idToRemove);
                localStorage.setItem(CONFIG.localStorageCartKey, JSON.stringify(newCart));
                window.location.reload();
            });
        });
    }

    // Checkout
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const user = JSON.parse(sessionStorage.getItem(CONFIG.storageUserKey));
            if (!user) {
                showNotification('Faça login para finalizar.', 'info');
                setTimeout(() => window.location.href = 'login.html', 1500);
                return;
            }
            
            let msg = `Olá! Sou ${user.firstName}.\nComprando:\n`;
            let total = 0;
            cart.forEach(i => {
                msg += `🎮 ${i.title} [${i.licenseLabel}] - ${formatPrice(i.price)}\n`;
                total += i.price;
            });
            msg += `\n💰 *Total: ${formatPrice(total)}*`;
            window.open(`https://wa.me/5511914521982?text=${encodeURIComponent(msg)}`, '_blank');
        });
    }
}