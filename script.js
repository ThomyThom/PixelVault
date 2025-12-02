document.addEventListener('DOMContentLoaded', async () => {
    
    // --- CONFIGURAÇÕES GLOBAIS ---
    const CONFIG = {
        apiBaseUrl: '/api',
        localStorageUserKey: 'pixelVaultUser',
        localStorageCartKey: 'pixelVaultCart'
    };

    // --- FUNÇÕES UTILITÁRIAS (Globais) ---
    window.showNotification = function(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        const note = document.createElement('div');
        note.className = `notification ${type} show`;
        note.textContent = message;
        container.appendChild(note);
        setTimeout(() => {
            note.classList.remove('show');
            setTimeout(() => note.remove(), 500);
        }, 3000);
    };

    function formatPrice(value) {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }

    // ============================================================
    // MÓDULO 1: SISTEMA DE LOGIN E REGISTRO (Prioridade Máxima)
    // ============================================================
    (function initAuthSystem() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        // Se não estamos na página de login, sai deste módulo
        if (!loginForm && !registerForm) return;

        console.log("Sistema de Autenticação Iniciado.");

        // 1. Alternância entre Login e Registro
        const showRegisterBtn = document.getElementById('show-register');
        const showLoginBtn = document.getElementById('show-login');
        const loginContainer = document.getElementById('login-form-container');
        const registerContainer = document.getElementById('register-form-container');

        if (showRegisterBtn && showLoginBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                loginContainer.style.display = 'none';
                registerContainer.style.display = 'block';
            });

            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                registerContainer.style.display = 'none';
                loginContainer.style.display = 'block';
            });
        }

        // 2. Lógica de Login
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = loginForm.querySelector('button');
                const originalText = btn.textContent;
                btn.textContent = 'Acessando...';
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

                    if (!res.ok) throw new Error(data.message || 'Falha ao entrar.');

                    localStorage.setItem(CONFIG.localStorageUserKey, JSON.stringify(data.user));
                    showNotification('Acesso Autorizado.', 'success');
                    setTimeout(() => window.location.href = 'index.html', 1000);

                } catch (err) {
                    showNotification(err.message, 'error');
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            });
        }

        // 3. Lógica de Registro
        if (registerForm) {
            // Validação visual de senha em tempo real
            const pwInput = document.getElementById('register-password');
            if (pwInput) {
                pwInput.addEventListener('input', (e) => {
                    const v = e.target.value;
                    const reqs = {
                        len: document.getElementById('req-length'),
                        low: document.getElementById('req-lowercase'),
                        up:  document.getElementById('req-uppercase'),
                        num: document.getElementById('req-number')
                    };
                    if(reqs.len) reqs.len.classList.toggle('valid', v.length >= 8);
                    if(reqs.low) reqs.low.classList.toggle('valid', /[a-z]/.test(v));
                    if(reqs.up)  reqs.up.classList.toggle('valid', /[A-Z]/.test(v));
                    if(reqs.num) reqs.num.classList.toggle('valid', /[0-9]/.test(v));
                });
            }

            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const pw = document.getElementById('register-password').value;
                const cpw = document.getElementById('confirm-password').value;
                
                if (pw !== cpw) return showNotification('Senhas não conferem.', 'error');

                const btn = registerForm.querySelector('button');
                const originalText = btn.textContent;
                btn.textContent = 'Forjando Chave...';
                btn.disabled = true;

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

                try {
                    const res = await fetch(`${CONFIG.apiBaseUrl}/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                    const data = await res.json();

                    if (!res.ok) throw new Error(data.message || 'Erro no registro.');

                    localStorage.setItem(CONFIG.localStorageUserKey, JSON.stringify(data.user));
                    showNotification('Chave Criada com Sucesso!', 'success');
                    setTimeout(() => window.location.href = 'index.html', 1500);

                } catch (err) {
                    showNotification(err.message, 'error');
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            });
        }
    })();

    // ============================================================
    // MÓDULO 2: INTERFACE DA LOJA (Header, Carrinho, Jogos)
    // ============================================================
    // Só executa se NÃO estivermos na página de login (para evitar erros)
    if (!document.querySelector('.login-page-body')) {
        
        // Injeção do Header
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
            // Lógica de Sessão e Menu
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
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem(CONFIG.localStorageUserKey);
                    window.location.reload();
                });
            }

            // Mobile Toggle
            const toggle = document.querySelector('.mobile-menu-toggle');
            const nav = document.querySelector('.main-nav');
            if (toggle && nav) {
                toggle.addEventListener('click', () => nav.classList.toggle('is-active'));
            }

            // Carrinho Count
            updateCartCount();
        }

        function updateCartCount() {
            const cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
            const el = document.getElementById('cart-count');
            if (el) el.textContent = cart.length;
        }

        // Carregar Jogos (Apenas se game-grid existir)
        const gameGrid = document.querySelector('.game-grid');
        if (gameGrid) {
            try {
                gameGrid.innerHTML = '<div class="loading-arsenal">ACESSANDO O COFRE...</div>';
                const res = await fetch(`${CONFIG.apiBaseUrl}/games`);
                if(!res.ok) throw new Error('Erro na API');
                const games = await res.json();
                
                gameGrid.innerHTML = '';
                
                // Lógica de Renderização (igual à anterior)
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
            } catch (e) {
                console.error(e);
                gameGrid.innerHTML = '<p style="text-align: center;">Erro de conexão.</p>';
            }

            // Event Delegation para Adicionar ao Carrinho
            gameGrid.addEventListener('click', (e) => {
                const btn = e.target.closest('.add-cart-icon-btn');
                if (e.target.classList.contains('price-info-link')) { e.preventDefault(); openPriceModal(); return; }
                
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
                    showNotification(`"${item.title}" adicionado!`);
                }
            });
        }
    }

    // Funções auxiliares de renderização (mantidas para garantir funcionamento)
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
                ${!isLocked ? `<button class="add-cart-icon-btn" data-id="${game._id}" data-title="${game.title}" data-img="${game.image}">ADICIONAR 🛒</button>` : ''}
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

    // Modal de Preços
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
                        <li><strong>R$ 20,00 (Digital):</strong> Acesso padrão.</li>
                        <li><strong>R$ 30,00 (Escola):</strong> Inclui taxa de mídia física (pendrive).</li>
                        <li><strong>R$ 50,00 (Combo):</strong> Acesso total (Casa + Escola).</li>
                    </ul>
                    <button class="cta-button modal-close-btn-action">Entendido</button>
                </div>
            `;
            document.body.appendChild(modal);
            modal.onclick = (e) => { if(e.target === modal || e.target.classList.contains('modal-close-btn') || e.target.classList.contains('modal-close-btn-action')) modal.remove(); };
        } else { modal.classList.add('is-active'); }
    }

    // MÓDULO 3: PÁGINA DO CARRINHO
    const cartList = document.querySelector('.cart-items-list');
    if (cartList) {
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
                        <button class="remove-item-btn" onclick="removeItem(${item.cartId})" aria-label="Remover">🗑️</button>
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

        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const user = JSON.parse(localStorage.getItem(CONFIG.localStorageUserKey));
                if (!user) return window.location.href = 'login.html';
                
                let msg = `Olá! Sou ${user.firstName} ${user.lastName}.\nComprando:\n`;
                let total = 0;
                cart.forEach(i => {
                    msg += `🎮 ${i.title} [${i.licenseLabel}] - ${formatPrice(i.price)}\n`;
                    total += i.price;
                });
                msg += `\nTotal: ${formatPrice(total)}`;
                window.open(`https://wa.me/5511914521982?text=${encodeURIComponent(msg)}`, '_blank');
            });
        }
    }
});