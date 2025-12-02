document.addEventListener('DOMContentLoaded', async () => {
    
    // --- CONFIGURAÇÕES ---
    const CONFIG = {
        apiBaseUrl: '/api',
        localStorageUserKey: 'pixelVaultUser',
        localStorageCartKey: 'pixelVaultCart'
    };

    // --- MÓDULO 1: COMPONENTES COMPARTILHADOS (Header) ---
    async function loadSharedComponents() {
        const headerHTML = `
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
                    <a href="carrinho.html" class="cart-icon" id="cart-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        <span class="cart-count" id="cart-count">0</span>
                    </a>
                </div>
                <button class="mobile-menu-toggle"><span></span><span></span><span></span></button>
            </div>
        `;

        const headerEl = document.querySelector('.site-header');
        if (headerEl && headerEl.innerHTML.trim() === '') {
            headerEl.innerHTML = headerHTML;
            initializeHeaderLogic();
        }
    }

    // --- MÓDULO 2: UTILITÁRIOS ---
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);
        void notification.offsetWidth; 
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- MÓDULO 3: LÓGICA DO HEADER ---
    function initializeHeaderLogic() {
        const loginLink = document.getElementById('login-link');
        const userNavItems = document.querySelectorAll('.user-nav');
        const userNameLink = document.getElementById('user-name-link');
        const logoutLink = document.getElementById('logout-link');
        const cartCountEl = document.getElementById('cart-count');
        const searchBar = document.getElementById('search-bar');
        
        // Sessão
        const userData = JSON.parse(localStorage.getItem(CONFIG.localStorageUserKey));
        if (userData && userData.firstName) {
            if(loginLink) loginLink.style.display = 'none';
            if(userNameLink) userNameLink.textContent = `Olá, ${userData.firstName}`;
            userNavItems.forEach(item => item.style.display = 'block');
        } else {
            if(loginLink) loginLink.style.display = 'block';
            userNavItems.forEach(item => item.style.display = 'none');
        }

        // Logout
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem(CONFIG.localStorageUserKey);
                showNotification('Até logo!', 'info');
                setTimeout(() => window.location.href = 'index.html', 1000);
            });
        }

        // Carrinho
        const cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
        if (cartCountEl) cartCountEl.textContent = cart.length;

        // Mobile Menu
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.main-nav');
        if (menuToggle && nav) {
            menuToggle.addEventListener('click', () => {
                menuToggle.classList.toggle('is-active');
                nav.classList.toggle('is-active');
            });
        }

        // Pesquisa Dinâmica
        if (searchBar) {
            searchBar.addEventListener('input', debounce((e) => {
                const term = e.target.value.toLowerCase();
                const cards = document.querySelectorAll('.game-card');
                let found = false;
                
                cards.forEach(card => {
                    const title = card.querySelector('h3').textContent.toLowerCase();
                    if (title.includes(term)) {
                        card.style.display = 'block';
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
    }

    // --- MÓDULO 4: CARREGAMENTO DE JOGOS (COM DROP SEMANAL) ---
    async function loadGames() {
        const gameGrid = document.querySelector('.game-grid');
        if (!gameGrid) return; 

        gameGrid.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const skel = document.createElement('div');
            skel.className = 'game-card skeleton-card';
            skel.innerHTML = `<div class="skeleton skeleton-image"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-price"></div>`;
            gameGrid.appendChild(skel);
        }

        try {
            const res = await fetch(`${CONFIG.apiBaseUrl}/games`);
            if(!res.ok) throw new Error('Falha ao buscar jogos');
            
            const games = await res.json();
            gameGrid.innerHTML = ''; 
            
            if (games.length === 0) {
                gameGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">O cofre está vazio.</p>';
                return;
            }

            const availableGames = games.filter(g => !g.isComingSoon);
            const dropGames = games.filter(g => g.isComingSoon);

            renderGameList(availableGames, gameGrid);

            if (dropGames.length > 0) {
                const banner = document.createElement('div');
                banner.className = 'glitch-banner';
                banner.style.gridColumn = '1 / -1';
                banner.innerHTML = `<h3>/// PRÓXIMO DROP: SEXTA-FEIRA ///</h3><p style="font-size: 0.8rem; opacity: 0.8;">[DADOS CRIPTOGRAFADOS]</p>`;
                gameGrid.appendChild(banner);

                dropGames.forEach(game => {
                    const card = document.createElement('div');
                    card.className = 'game-card locked animate-on-scroll';
                    card.dataset.category = 'drop';
                    
                    card.innerHTML = `
                        <div class="lock-overlay">
                            <svg class="lock-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <span class="lock-text">CONFIDENCIAL</span>
                        </div>
                        <img src="${game.image}" alt="Confidencial" loading="lazy">
                        <div class="card-content">
                            <h3>${game.title}</h3>
                            <div class="price" style="color: #666;">--,--</div>
                        </div>
                    `;
                    gameGrid.appendChild(card);
                    requestAnimationFrame(() => card.classList.add('is-visible'));
                });
            }

        } catch (error) {
            console.error(error);
            gameGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--error-color);">Erro de conexão.</p>';
        }
    }

    function renderGameList(gamesList, container) {
        gamesList.forEach((game, index) => {
            const card = document.createElement('div');
            card.className = 'game-card animate-on-scroll';
            card.style.transitionDelay = `${index * 50}ms`;
            card.dataset.category = game.categories ? game.categories.join(' ') : '';
            
            card.innerHTML = `
                <img src="${game.image}" alt="${game.title}" loading="lazy">
                <div class="card-content">
                    <h3>${game.title}</h3>
                    <div class="price">R$ ${game.price.toFixed(2).replace('.', ',')}</div>
                </div>
                <button class="add-cart-icon-btn" aria-label="Adicionar ${game.title}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            `;

            const btn = card.querySelector('.add-cart-icon-btn');
            btn.addEventListener('click', () => {
                let cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
                if (cart.find(i => i.id === game._id)) return showNotification('Já está no carrinho!', 'info');
                cart.push({ id: game._id, title: game.title, price: game.price, imageSrc: game.image });
                localStorage.setItem(CONFIG.localStorageCartKey, JSON.stringify(cart));
                const count = document.getElementById('cart-count');
                if(count) count.textContent = cart.length;
                showNotification(`${game.title} adicionado!`);
            });

            container.appendChild(card);
            requestAnimationFrame(() => card.classList.add('is-visible'));
        });
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
                        card.style.display = 'block';
                        requestAnimationFrame(() => card.classList.add('is-visible'));
                    } else {
                        card.classList.remove('is-visible');
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // --- MÓDULO 5: CARRINHO E CHECKOUT ---
    const cartItemsList = document.querySelector('.cart-items-list');
    if (cartItemsList) {
        function renderCart() {
            const cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
            const totalEl = document.getElementById('cart-total');
            cartItemsList.innerHTML = '';
            let total = 0;

            if (cart.length === 0) {
                cartItemsList.innerHTML = '<p class="empty-cart-msg">Carrinho vazio.</p>';
                if(totalEl) totalEl.textContent = 'R$ 0,00';
                return;
            }

            cart.forEach(item => {
                total += item.price;
                const el = document.createElement('div');
                el.className = 'cart-item animate-on-load is-visible';
                el.innerHTML = `
                    <img src="${item.imageSrc}" alt="${item.title}">
                    <div class="cart-item-info">
                        <h4>${item.title}</h4>
                        <p>R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="remove-item-btn" data-id="${item.id}">&times;</button>
                `;
                cartItemsList.appendChild(el);
            });

            if(totalEl) totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

            document.querySelectorAll('.remove-item-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    const newCart = cart.filter(i => i.id !== id);
                    localStorage.setItem(CONFIG.localStorageCartKey, JSON.stringify(newCart));
                    renderCart();
                    const count = document.getElementById('cart-count');
                    if(count) count.textContent = newCart.length;
                });
            });
        }
        renderCart();

        const checkoutBtn = document.querySelector('.checkout-btn');
        if(checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const user = JSON.parse(localStorage.getItem(CONFIG.localStorageUserKey));
                if (!user) {
                    showNotification('Faça login primeiro.', 'error');
                    setTimeout(() => window.location.href = 'login.html', 2000);
                    return;
                }
                const cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
                if(cart.length === 0) return showNotification('Carrinho vazio.', 'error');

                const total = cart.reduce((acc, item) => acc + item.price, 0);
                const itemsList = cart.map(i => `- ${i.title}`).join('\n');
                const msg = `Olá! Sou ${user.firstName} ${user.lastName} (${user.school}).\nGostaria de comprar:\n${itemsList}\n\nTotal: R$ ${total.toFixed(2)}\nComo procedo?`;
                
                window.open(`https://wa.me/5511914521982?text=${encodeURIComponent(msg)}`, '_blank');
            });
        }
    }

    // --- MÓDULO 6: LOGIN E REGISTRO ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Autenticando...';
            btn.disabled = true;

            try {
                const res = await fetch(`${CONFIG.apiBaseUrl}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: document.getElementById('login-email').value,
                        password: document.getElementById('login-password').value
                    })
                });
                const data = await res.json();
                
                if (!res.ok) throw new Error(data.message || 'Falha no login');

                localStorage.setItem(CONFIG.localStorageUserKey, JSON.stringify(data.user));
                showNotification('Acesso concedido.', 'success');
                setTimeout(() => window.location.href = 'index.html', 1000);

            } catch (err) {
                showNotification(err.message, 'error');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form-container').style.display = 'none';
            document.getElementById('register-form-container').style.display = 'block';
        });
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form-container').style.display = 'none';
            document.getElementById('login-form-container').style.display = 'block';
        });

        const pwInput = document.getElementById('register-password');
        if(pwInput) {
            pwInput.addEventListener('input', (e) => {
                const v = e.target.value;
                document.getElementById('req-length').classList.toggle('valid', v.length >= 8);
                document.getElementById('req-lowercase').classList.toggle('valid', /[a-z]/.test(v));
                document.getElementById('req-uppercase').classList.toggle('valid', /[A-Z]/.test(v));
                document.getElementById('req-number').classList.toggle('valid', /[0-9]/.test(v));
            });
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pw = document.getElementById('register-password').value;
            const cpw = document.getElementById('confirm-password').value;
            if (pw !== cpw) return showNotification('Senhas não conferem.', 'error');

            const formData = {
                firstName: document.getElementById('register-firstName').value,
                lastName: document.getElementById('register-lastName').value,
                email: document.getElementById('register-email').value,
                password: pw,
                confirm_password: cpw,
                school: document.getElementById('school').value,
                grade: document.getElementById('grade').value,
                course: document.getElementById('course').value,
                phone: document.getElementById('phone').value,
                cpf: document.getElementById('cpf').value
            };

            const btn = registerForm.querySelector('button');
            btn.disabled = true;
            btn.textContent = 'Forjando chave...';

            try {
                const res = await fetch(`${CONFIG.apiBaseUrl}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);

                showNotification('Conta criada! Faça login.', 'success');
                localStorage.setItem(CONFIG.localStorageUserKey, JSON.stringify(data.user));
                setTimeout(() => window.location.href = 'index.html', 1500);
            } catch (err) {
                showNotification(err.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Registrar';
            }
        });
    }

    // --- MÓDULO 7: EXTRAS GLOBAIS (Compartilhar & Animações) ---
    // Botão de Compartilhar (Fixado)
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.addEventListener('click', (e) => {
            e.preventDefault();
            const siteUrl = window.location.origin;
            const message = `E aí! Encontrei o Pixel Vault, uma loja de jogos de PC por R$20 pra galera da escola. Dá uma olhada: ${siteUrl}`;
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        });
    }

    // Observador de Animação Global (ESSENCIAL PARA 'COMO TRABALHAMOS' APARECER)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Observa todos os elementos animados que já existem no DOM
    document.querySelectorAll('.animate-on-scroll, .animate-on-load').forEach(el => observer.observe(el));

    // --- INICIALIZAÇÃO ---
    await loadSharedComponents();
    loadGames();

});