document.addEventListener('DOMContentLoaded', async () => {
    
    // --- CONFIGURAÇÕES ---
    const CONFIG = {
        apiBaseUrl: '/api',
        localStorageUserKey: 'pixelVaultUser',
        localStorageCartKey: 'pixelVaultCart'
    };

    // ============================================================
    // MÓDULO 1: ATIVAÇÃO IMEDIATA (Eventos Globais)
    // ============================================================
    // Ativa funcionalidades críticas antes de qualquer carregamento de dados
    
    // 1.1 Botão de Compartilhar (Global)
    document.addEventListener('click', (e) => {
        const shareBtn = e.target.closest('#share-button'); 
        if (shareBtn) {
            e.preventDefault();
            const text = "Pixel Vault: A loja de jogos oficial da galera. Confere aí: " + window.location.origin;
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    });

    // 1.2 Filtros de Categoria (Global)
    const categoryBtns = document.querySelectorAll('.category-btn');
    if (categoryBtns.length > 0) {
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // UI Update
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                
                const cat = btn.dataset.category;
                const cards = document.querySelectorAll('.game-card');
                
                let found = false;
                cards.forEach(card => {
                    // Proteção para cards de esqueleto
                    if (card.classList.contains('skeleton-card')) return;

                    const cardCats = card.dataset.category || '';
                    if (cat === 'all' || cardCats.includes(cat)) {
                        card.style.display = 'flex';
                        // Pequeno delay para animação suave
                        setTimeout(() => card.classList.add('is-visible'), 10);
                        found = true;
                    } else {
                        card.style.display = 'none';
                        card.classList.remove('is-visible');
                    }
                });

                // Mensagem de "Nenhum resultado"
                const noResults = document.getElementById('no-results-message');
                if (noResults) noResults.style.display = found ? 'none' : 'block';
            });
        });
    }

    // 1.3 Observador de Rodapé (Para subir o botão share)
    const footerElement = document.querySelector('.site-footer-bottom');
    const shareButtonElement = document.getElementById('share-button');
    if (footerElement && shareButtonElement) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) shareButtonElement.classList.add('lift-up');
                else shareButtonElement.classList.remove('lift-up');
            });
        }, { root: null, threshold: 0.1 });
        observer.observe(footerElement);
    }

    // ============================================================
    // MÓDULO 2: UTILITÁRIOS & HEADER
    // ============================================================
    window.showNotification = function(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        const note = document.createElement('div');
        note.className = `notification ${type} show`;
        note.textContent = message;
        container.appendChild(note);
        setTimeout(() => { note.classList.remove('show'); setTimeout(() => note.remove(), 500); }, 3000);
    };

    function formatPrice(value) {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }

    // Injeta Header se necessário
    const headerEl = document.querySelector('.site-header');
    if (headerEl && headerEl.innerHTML.trim() === '') {
        headerEl.innerHTML = `
            <div class="container">
                <a href="index.html" class="logo">Pixel Vault</a>
                <div class="search-container">
                    <input type="search" id="search-bar" placeholder="Buscar jogos...">
                </div>
                <nav class="main-nav">
                    <ul id="main-menu">
                        <li><a href="index.html#destaques">Destaques</a></li>
                        <li><a href="index.html#categorias">Categorias</a></li>
                        <li id="login-link"><a href="login.html">Entrar</a></li>
                        <li class="user-nav" style="display: none;"><a href="#" id="user-name-link"></a></li>
                        <li class="user-nav" style="display: none;"><a href="comotrabalhamos.html">Como Trabalhamos</a></li>
                        <li class="user-nav" style="display: none;"><a href="#" id="logout-link">Sair</a></li>
                    </ul>
                </nav>
                <div class="header-actions">
                    <a href="carrinho.html" class="cart-icon"><span class="cart-count" id="cart-count">0</span>🛒</a>
                </div>
                <button class="mobile-menu-toggle"><span></span><span></span><span></span></button>
            </div>
        `;
        initHeaderEvents();
    }

    function initHeaderEvents() {
        // Mobile Toggle
        const toggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.main-nav');
        if (toggle && nav) {
            toggle.addEventListener('click', () => nav.classList.toggle('is-active'));
        }

        // Auth Check
        const user = JSON.parse(localStorage.getItem(CONFIG.localStorageUserKey));
        const loginLink = document.getElementById('login-link');
        const userNavs = document.querySelectorAll('.user-nav');
        
        if (user && user.firstName) {
            if (loginLink) loginLink.style.display = 'none';
            userNavs.forEach(el => el.style.display = 'block');
            const nameLink = document.getElementById('user-name-link');
            if (nameLink) nameLink.textContent = `Olá, ${user.firstName}`;
        } else {
            if (loginLink) loginLink.style.display = 'block';
            userNavs.forEach(el => el.style.display = 'none');
        }

        // Logout
        const logoutBtn = document.getElementById('logout-link');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem(CONFIG.localStorageUserKey);
                window.location.reload();
            });
        }

        // Search Logic
        const searchBar = document.getElementById('search-bar');
        if (searchBar) {
            let timeout;
            searchBar.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    const term = e.target.value.toLowerCase();
                    const cards = document.querySelectorAll('.game-card');
                    let found = false;
                    cards.forEach(card => {
                        if (card.classList.contains('skeleton-card')) return;
                        const title = card.querySelector('h3').textContent.toLowerCase();
                        if (title.includes(term)) {
                            card.style.display = 'flex';
                            card.classList.add('is-visible');
                            found = true;
                        } else {
                            card.style.display = 'none';
                            card.classList.remove('is-visible');
                        }
                    });
                    const noResults = document.getElementById('no-results-message');
                    if (noResults) noResults.style.display = found ? 'none' : 'block';
                }, 300);
            });
        }
        updateCartCount();
    }

    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
        const el = document.getElementById('cart-count');
        if (el) el.textContent = cart.length;
    }

    // ============================================================
    // MÓDULO 3: CARREGAMENTO DE JOGOS (Async)
    // ============================================================
    const gameGrid = document.querySelector('.game-grid');
    if (gameGrid) {
        try {
            // Loading State
            gameGrid.innerHTML = '<div class="loading-arsenal">ACESSANDO O COFRE...</div>';
            
            const res = await fetch(`${CONFIG.apiBaseUrl}/games`);
            if(!res.ok) throw new Error('Erro na API');
            const games = await res.json();
            
            gameGrid.innerHTML = ''; // Clear loading

            if (games.length === 0) {
                gameGrid.innerHTML = '<p style="text-align: center; width: 100%;">Cofre vazio.</p>';
            } else {
                const availableGames = games.filter(g => !g.isComingSoon);
                const dropGames = games.filter(g => g.isComingSoon);

                renderGames(availableGames, gameGrid);

                if(dropGames.length > 0) {
                    const banner = document.createElement('div');
                    banner.className = 'glitch-banner';
                    banner.style.gridColumn = '1 / -1';
                    banner.innerHTML = `<h3>/// DROP RESTRITO ///</h3><p>[DADOS CRIPTOGRAFADOS]</p>`;
                    gameGrid.appendChild(banner);
                    renderGames(dropGames, gameGrid, true);
                }
            }
        } catch (e) {
            console.error(e);
            gameGrid.innerHTML = '<p style="text-align: center;">Erro de conexão. Tente recarregar.</p>';
        }

        // Global Click Listener for Add to Cart (Works for all dynamic cards)
        gameGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.add-cart-icon-btn');
            
            // Info Link
            if (e.target.classList.contains('price-info-link')) {
                e.preventDefault();
                openPriceModal();
                return;
            }

            if (btn) {
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
                showNotification(`"${item.title}" (${item.licenseLabel}) adicionado!`);
            }
        });
    }

    function renderGames(list, container, isLocked = false) {
        list.forEach(game => {
            const card = document.createElement('div');
            card.className = `game-card animate-on-scroll ${isLocked ? 'locked' : ''}`;
            card.dataset.category = game.categories ? game.categories.join(' ') : '';
            
            card.innerHTML = `
                ${isLocked ? '<div class="lock-overlay"><span class="lock-text">EM BREVE</span></div>' : ''}
                <img src="${game.image}" alt="${game.title}">
                <div class="card-content">
                    <h3>${game.title}</h3>
                    
                    ${!isLocked ? `
                    <select class="license-select">
                        <option value="pessoal" data-price="20">PC Pessoal (R$ 20)</option>
                        <option value="escola" data-price="30">PC Escola (R$ 30)</option>
                        <option value="ambos" data-price="50">Ambos (R$ 50)</option>
                    </select>
                    <a class="price-info-link">Por que esses valores?</a>
                    ` : ''}

                    <div class="price" id="price-${game._id}">${isLocked ? '???' : 'R$ 20,00'}</div>
                </div>
                
                ${!isLocked ? `
                <button class="add-cart-icon-btn" data-id="${game._id}" data-title="${game.title}" data-img="${game.image}">
                    ADICIONAR <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </button>
                ` : ''}
            `;
            container.appendChild(card);

            if (!isLocked) {
                const select = card.querySelector('.license-select');
                const priceEl = card.querySelector(`#price-${game._id}`);
                select.addEventListener('change', (e) => {
                    const newPrice = parseFloat(e.target.options[e.target.selectedIndex].dataset.price);
                    priceEl.textContent = formatPrice(newPrice);
                });
            }
        });
    }

    function openPriceModal() {
        let modal = document.getElementById('price-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'price-modal';
            modal.className = 'modal-overlay is-active';
            modal.innerHTML = `
                <div class="modal-container">
                    <button class="modal-close-btn">&times;</button>
                    <h2 class="modal-title">Entenda os Valores</h2>
                    <ul class="price-rules">
                        <li><strong>R$ 20,00 (Digital):</strong> Acesso apenas aos arquivos do jogo.</li>
                        <li><strong>R$ 30,00 (Escola):</strong> Inclui taxa de mídia física (pendrive) e setup.</li>
                        <li><strong>R$ 50,00 (Combo):</strong> Acesso total para ambas as plataformas.</li>
                    </ul>
                    <button class="cta-button modal-close-btn-action">Entendido</button>
                </div>
            `;
            document.body.appendChild(modal);
            modal.onclick = (e) => { if (e.target === modal || e.target.classList.contains('modal-close-btn') || e.target.classList.contains('modal-close-btn-action')) modal.remove(); };
        } else {
            modal.classList.add('is-active');
        }
    }

    // ============================================================
    // MÓDULO 4: CARRINHO (PÁGINA)
    // ============================================================
    const cartList = document.querySelector('.cart-items-list');
    if (cartList) {
        const cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
        const totalEl = document.getElementById('cart-total');
        
        if (cart.length === 0) {
            cartList.innerHTML = '<p class="empty-cart-msg">Seu carrinho está vazio.</p>';
            if (totalEl) totalEl.textContent = 'R$ 0,00';
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
                        <button class="remove-item-btn" onclick="removeItem(${item.cartId})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                `;
            });
            if (totalEl) totalEl.textContent = formatPrice(total);
        }

        window.removeItem = function(cartId) {
            const newCart = cart.filter(i => i.cartId !== cartId);
            localStorage.setItem(CONFIG.localStorageCartKey, JSON.stringify(newCart));
            window.location.reload();
        };

        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const user = JSON.parse(localStorage.getItem(CONFIG.localStorageUserKey));
                if (!user) return window.location.href = 'login.html';
                
                let msg = `Olá! Sou ${user.firstName} ${user.lastName} (${user.school}).\nGostaria de comprar:\n\n`;
                let total = 0;
                
                cart.forEach(i => {
                    msg += `🎮 ${i.title}\n   └ [${i.licenseLabel}] - ${formatPrice(i.price)}\n`;
                    total += i.price;
                });
                
                msg += `\n💰 *Total: ${formatPrice(total)}*\n\nComo posso realizar o pagamento?`;
                window.open(`https://wa.me/5511914521982?text=${encodeURIComponent(msg)}`, '_blank');
            });
        }
    }
});