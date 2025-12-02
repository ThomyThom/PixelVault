document.addEventListener('DOMContentLoaded', async () => {
    
    const CONFIG = {
        apiBaseUrl: '/api',
        localStorageUserKey: 'pixelVaultUser',
        localStorageCartKey: 'pixelVaultCart'
    };

    // 1. INJETAR HEADER (Se estiver vazio)
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

    // 2. UTILITÁRIOS
    window.showNotification = function(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        const note = document.createElement('div');
        note.className = `notification ${type} show`;
        note.textContent = message;
        container.appendChild(note);
        setTimeout(() => note.remove(), 3000);
    };

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function formatPrice(value) {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }

    // 3. HEADER & AUTH
    function initHeaderEvents() {
        // Mobile Menu
        const toggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.main-nav');
        if (toggle && nav) {
            toggle.addEventListener('click', () => {
                nav.classList.toggle('is-active');
            });
        }

        // Auth
        const user = JSON.parse(localStorage.getItem(CONFIG.localStorageUserKey));
        const loginLink = document.getElementById('login-link');
        const userNavs = document.querySelectorAll('.user-nav');
        
        if (user && user.firstName) {
            if(loginLink) loginLink.style.display = 'none';
            userNavs.forEach(el => el.style.display = 'block');
            const nameLink = document.getElementById('user-name-link');
            if(nameLink) nameLink.textContent = `Olá, ${user.firstName}`;
        } else {
            if(loginLink) loginLink.style.display = 'block';
            userNavs.forEach(el => el.style.display = 'none');
        }

        // Logout
        const logoutBtn = document.getElementById('logout-link');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem(CONFIG.localStorageUserKey);
                window.location.reload();
            });
        }

        // Pesquisa
        const searchBar = document.getElementById('search-bar');
        if (searchBar) {
            searchBar.addEventListener('input', debounce((e) => {
                const term = e.target.value.toLowerCase();
                const cards = document.querySelectorAll('.game-card');
                let found = false;
                
                cards.forEach(card => {
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
                if(noResults) noResults.style.display = found ? 'none' : 'block';
            }, 300));
        }

        updateCartCount();
    }

    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
        const el = document.getElementById('cart-count');
        if(el) el.textContent = cart.length;
    }

    // 4. LOJA (LÓGICA 20/30/50)
    const gameGrid = document.querySelector('.game-grid');
    if (gameGrid) {
        try {
            gameGrid.innerHTML = '<p style="text-align:center; width:100%;">Carregando arsenal...</p>';
            const res = await fetch(`${CONFIG.apiBaseUrl}/games`);
            if(!res.ok) throw new Error('Erro na API');
            const games = await res.json();
            
            gameGrid.innerHTML = ''; 

            if(games.length === 0) {
                gameGrid.innerHTML = '<p>Cofre vazio.</p>';
            } else {
                const availableGames = games.filter(g => !g.isComingSoon);
                const dropGames = games.filter(g => g.isComingSoon);

                // Renderiza Jogos Normais
                renderGames(availableGames, gameGrid);

                // Renderiza Drops (Se houver)
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
            gameGrid.innerHTML = '<p>Erro de conexão. Tente recarregar.</p>';
        }
    }

    function renderGames(list, container, isLocked = false) {
        list.forEach(game => {
            const card = document.createElement('div');
            card.className = `game-card animate-on-scroll ${isLocked ? 'locked' : ''}`;
            card.dataset.category = game.categories ? game.categories.join(' ') : '';
            
            // Lógica do Preço Base (Padrão 20.00 se não definido)
            const basePrice = 20.00;

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
                    ` : ''}

                    <div class="price" id="price-${game._id}">R$ 20,00</div>
                </div>
                
                ${!isLocked ? `
                <button class="add-cart-icon-btn" data-id="${game._id}" data-title="${game.title}" data-img="${game.image}">
                    ADICIONAR <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </button>
                ` : ''}
            `;
            container.appendChild(card);

            // Evento: Mudar Preço ao trocar opção
            if (!isLocked) {
                const select = card.querySelector('.license-select');
                const priceEl = card.querySelector(`#price-${game._id}`);
                
                select.addEventListener('change', (e) => {
                    const newPrice = parseFloat(e.target.options[e.target.selectedIndex].dataset.price);
                    priceEl.textContent = formatPrice(newPrice);
                    // Piscar para indicar mudança
                    priceEl.style.color = '#fff';
                    setTimeout(() => priceEl.style.color = 'var(--primary-color)', 200);
                });
            }
        });

        // Evento Global: Adicionar ao Carrinho (Captura o valor do select no momento do clique)
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.add-cart-icon-btn');
            if (btn) {
                const card = btn.closest('.game-card');
                const select = card.querySelector('.license-select');
                const selectedOption = select.options[select.selectedIndex];
                
                const item = {
                    id: btn.dataset.id, // ID único do jogo
                    cartId: Date.now(), // ID único para o carrinho (permite ter o mesmo jogo com licenças diferentes)
                    title: btn.dataset.title,
                    imageSrc: btn.dataset.img,
                    licenseType: selectedOption.value, // 'pessoal', 'escola', 'ambos'
                    licenseLabel: selectedOption.text.split(' (')[0], // Texto bonito para exibir
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

    // 5. BOTÃO COMPARTILHAR
    document.addEventListener('click', (e) => {
        const shareBtn = e.target.closest('#share-button'); 
        if (shareBtn) {
            e.preventDefault();
            const text = "Loja de jogos para PC da escola: " + window.location.origin;
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    });

    // 6. CARRINHO (Página)
    const cartList = document.querySelector('.cart-items-list');
    if (cartList) {
        const cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
        const totalEl = document.getElementById('cart-total');
        
        if (cart.length === 0) {
            cartList.innerHTML = '<p>Seu carrinho está vazio.</p>';
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
                            <p style="font-size: 0.9rem; color: #aaa;">Licença: <strong style="color:var(--primary-color)">${item.licenseLabel}</strong></p>
                            <p>${formatPrice(item.price)}</p>
                        </div>
                        <button class="remove-item-btn" onclick="removeItem(${item.cartId})">Remover</button>
                    </div>
                `;
            });
            if(totalEl) totalEl.textContent = formatPrice(total);
        }

        window.removeItem = function(cartId) {
            const newCart = cart.filter(i => i.cartId !== cartId);
            localStorage.setItem(CONFIG.localStorageCartKey, JSON.stringify(newCart));
            window.location.reload();
        };

        // Checkout WhatsApp Formatado
        const checkoutBtn = document.querySelector('.checkout-btn');
        if(checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const user = JSON.parse(localStorage.getItem(CONFIG.localStorageUserKey));
                if(!user) return window.location.href = 'login.html';
                
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

    // Filtros de Categoria
    const categoryBtns = document.querySelectorAll('.category-btn');
    if(categoryBtns.length > 0) {
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.category-btn.is-active').classList.remove('is-active');
                btn.classList.add('is-active');
                const cat = btn.dataset.category;
                const cards = document.querySelectorAll('.game-card');
                
                cards.forEach(card => {
                    const cardCats = card.dataset.category || '';
                    if (cat === 'all' || cardCats.includes(cat)) {
                        card.style.display = 'flex';
                        card.classList.add('is-visible');
                    } else {
                        card.style.display = 'none';
                        card.classList.remove('is-visible');
                    }
                });
            });
        });
    }
});