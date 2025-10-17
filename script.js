document.addEventListener('DOMContentLoaded', () => {

    // --- FUNÇÕES DE UI ---
    function showNotification(message, type = 'success') { // 'success' or 'info'
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);
        
        // Trigger the animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove the notification after some time
        setTimeout(() => {
            notification.classList.remove('show');
            // Remove from DOM after transition ends
            notification.addEventListener('transitionend', () => {
                notification.remove();
            });
        }, 3000);
    }

    // --- ANIMAÇÕES E EFEITOS VISUAIS ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    function observeAnimatedElements() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll:not(.is-visible)');
        animatedElements.forEach(el => observer.observe(el));
    }
    
    observeAnimatedElements();

    const loadAnimatedElements = document.querySelectorAll('.animate-on-load');
    loadAnimatedElements.forEach((el, index) => {
        el.style.setProperty('--i', index);
        setTimeout(() => el.classList.add('is-visible'), 100);
    });

    // --- MENU MOBILE ---
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('is-active');
        nav.classList.toggle('is-active');
    });

    // --- FILTROS E PESQUISA ---
    const searchBar = document.getElementById('search-bar');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const gameCards = document.querySelectorAll('.game-card');
    const noResultsMessage = document.getElementById('no-results-message');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    let activeCategory = 'all';
    const initialVisibleCount = 8;
    
    function filterAndShowGames() {
        const searchTerm = searchBar.value.toLowerCase();
        let visibleGames = [];

        gameCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const category = card.dataset.category;
            const searchMatch = title.includes(searchTerm);
            const categoryMatch = activeCategory === 'all' || category.includes(activeCategory);

            card.style.display = 'none'; // Hide all cards initially
            card.classList.remove('is-visible');
            if (searchMatch && categoryMatch) {
                visibleGames.push(card);
            }
        });

        visibleGames.forEach((card, index) => {
            if (index < initialVisibleCount) {
                card.style.display = 'block';
                setTimeout(() => card.classList.add('is-visible'), 10); // Trigger animation
            }
        });

        noResultsMessage.style.display = visibleGames.length === 0 ? 'block' : 'none';
        loadMoreBtn.style.display = visibleGames.length > initialVisibleCount ? 'inline-block' : 'none';
        
        observeAnimatedElements();
    }

    searchBar.addEventListener('input', filterAndShowGames);
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            activeCategory = btn.dataset.category;
            filterAndShowGames();
        });
    });

    // --- LÓGICA "CARREGAR MAIS" ---
    loadMoreBtn.addEventListener('click', () => {
        const hiddenCards = Array.from(document.querySelectorAll('.game-card')).filter(card => card.style.display === 'none');
        hiddenCards.forEach(card => {
            card.style.display = 'block';
             setTimeout(() => card.classList.add('is-visible'), 10);
        });
        loadMoreBtn.style.display = 'none';
        observeAnimatedElements();
    });

    // --- LÓGICA DO CARRINHO ---
    const cartIcon = document.getElementById('cart-icon');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');

    let cart = [];

    cartIcon.addEventListener('click', () => cartOverlay.classList.add('is-active'));
    closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('is-active'));
    cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) cartOverlay.classList.remove('is-active');
    });

    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.game-card');
            const title = card.querySelector('h3').textContent;
            const price = 20.00;
            const imageSrc = card.querySelector('img').src;
            const itemId = title;

            if (cart.find(item => item.id === itemId)) {
                showNotification(`"${title}" já está no seu carrinho.`, 'info');
                return;
            }
            cart.push({ id: itemId, title, price, imageSrc });
            updateCart();
            showNotification(`"${title}" foi adicionado ao carrinho!`);
        });
    });

    function updateCart() {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
        } else {
            cart.forEach(item => {
                total += item.price;
                const cartItemEl = document.createElement('div');
                cartItemEl.classList.add('cart-item');
                cartItemEl.innerHTML = `
                    <img src="${item.imageSrc}" alt="${item.title}" loading="lazy">
                    <div class="cart-item-info">
                        <h4>${item.title}</h4>
                        <p>R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="remove-item-btn" data-id="${item.id}">&times;</button>
                `;
                cartItemsContainer.appendChild(cartItemEl);
            });
        }
        
        cartCountEl.textContent = cart.length;
        cartTotalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idToRemove = e.target.dataset.id;
                cart = cart.filter(item => item.id !== idToRemove);
                updateCart();
            });
        });
    }

    // Initial filter call on page load
    filterAndShowGames();
});