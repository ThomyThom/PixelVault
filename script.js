document.addEventListener('DOMContentLoaded', async () => {
    
    // --- CONFIGURAÇÕES ---
    const CONFIG = {
        apiBaseUrl: '/api',
        localStorageUserKey: 'pixelVaultUser',
        localStorageCartKey: 'pixelVaultCart'
    };

    // ============================================================
    // MÓDULO 1: FUNCIONALIDADES GLOBAIS (Compartilhar, Header)
    // ============================================================

    // 1.1 BOTÃO DE COMPARTILHAR (RESTABELECIDO)
    // Usamos um ouvinte no documento para garantir que o clique seja capturado
    document.addEventListener('click', (e) => {
        // Verifica se clicou no botão ou em qualquer elemento dentro dele (ícone, texto)
        const shareBtn = e.target.closest('#share-button'); 
        
        if (shareBtn) {
            e.preventDefault();
            const text = "Pixel Vault: A loja de jogos oficial da galera. Confere aí: " + window.location.origin;
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    });

    // 1.2 Observador de Rodapé (Para o botão subir e não tapar o Discord)
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

    // 1.3 Utilitários
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

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // 1.4 Injeção do Header (Se necessário)
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
                        <li class="user-nav mobile-only" style="display: none;"><a href="#" id="logout-link">Sair</a></li>
                    </ul>
                </nav>
                <div class="header-actions">
                    <a href="carrinho.html" class="cart-icon" aria-label="Carrinho">
                        <span class="cart-count" id="cart-count">0</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    </a>
                    <a href="login.html" id="user-profile-icon" class="user-icon" aria-label="Perfil">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </a>
                </div>
                <button class="mobile-menu-toggle"><span></span><span></span><span></span></button>
            </div>
        `;
        initHeaderEvents();
    }

    function initHeaderEvents() {
        const user = JSON.parse(localStorage.getItem(CONFIG.localStorageUserKey));
        const loginLink = document.getElementById('login-link');
        const userNavs = document.querySelectorAll('.user-nav');
        const profileIcon = document.getElementById('user-profile-icon');
        const nameLink = document.getElementById('user-name-link');
        
        if (user && user.firstName) {
            if(loginLink) loginLink.style.display = 'none';
            userNavs.forEach(el => el.style.display = 'block');
            if(nameLink) nameLink.textContent = `Olá, ${user.firstName}`;
            profileIcon.href = "perfil.html";
            profileIcon.classList.add('is-logged-in');
        } else {
            if(loginLink) loginLink.style.display = 'block';
            userNavs.forEach(el => el.style.display = 'none');
            profileIcon.href = "login.html";
            profileIcon.classList.remove('is-logged-in');
        }

        const logoutBtn = document.getElementById('logout-link');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem(CONFIG.localStorageUserKey);
                window.location.reload();
            });
        }

        const toggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.main-nav');
        if (toggle && nav) {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('is-active');
                nav.classList.toggle('is-active');
            });
        }

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
        if (el) el.textContent = cart.length;
    }

    // ============================================================
    // MÓDULO 2: AUTENTICAÇÃO (Login/Registro)
    // ============================================================
    // Isolado para rodar apenas nas páginas de formulário
    (function initAuthSystem() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (!loginForm && !registerForm) return; // Sai se não estiver na página de login

        // Toggle Login/Register
        const showRegisterBtn = document.getElementById('show-register');
        const showLoginBtn = document.getElementById('show-login');
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('login-form-container').style.display = 'none';
                document.getElementById('register-form-container').style.display = 'block';
            });
        }
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('register-form-container').style.display = 'none';
                document.getElementById('login-form-container').style.display = 'block';
            });
        }

        // Login Submit
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
                    if (!res.ok) throw new Error(data.message);

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

        // Register Submit
        if (registerForm) {
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
                    if (!res.ok) throw new Error(data.message);

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
    // MÓDULO 3: LOJA E JOGOS
    // ============================================================
    const gameGrid = document.querySelector('.game-grid');
    if (gameGrid) {
        try {
            gameGrid.innerHTML = '<div class="loading-arsenal">ACESSANDO O COFRE...</div>';
            const res = await fetch(`${CONFIG.apiBaseUrl}/games`);
            if(!res.ok) throw new Error('Erro na API');
            const games = await res.json();
            
            gameGrid.innerHTML = '';
            
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

        // Adicionar ao Carrinho (Event Delegation)
        gameGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.add-cart-icon-btn');
            
            // Modal de Preços
            if (e.target.classList.contains('price-info-link')) {
                e.preventDefault();
                openPriceModal();
                return;
            }
            
            // Adicionar Item
            if (btn) {
                const card = btn.closest('.game-card');
                if(card.classList.contains('locked')) return;

                const select = card.querySelector('.license-select');
                const selectedOption = select.options[select.selectedIndex];
                
                const item = {
                    id: btn.dataset.id,
                    cartId: Date.now(), // ID único para o carrinho
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
                        <li><strong>R$ 20,00 (Digital):</strong> Acesso apenas aos arquivos do jogo.</li>
                        <li><strong>R$ 30,00 (Escola):</strong> Inclui taxa de mídia física (pendrive) e setup.</li>
                        <li><strong>R$ 50,00 (Combo):</strong> Acesso total para ambas as plataformas.</li>
                    </ul>
                    <button class="cta-button modal-close-btn-action">Entendido</button>
                </div>
            `;
            document.body.appendChild(modal);
            modal.onclick = (e) => { if(e.target===modal || e.target.classList.contains('modal-close-btn') || e.target.classList.contains('modal-close-btn-action')) modal.remove(); };
        } else { modal.classList.add('is-active'); }
    }

    // Filtros de Categoria (AGORA FUNCIONANDO)
    const categoryBtns = document.querySelectorAll('.category-btn');
    if (categoryBtns.length > 0) {
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                
                const cat = btn.dataset.category;
                const cards = document.querySelectorAll('.game-card');
                
                let found = false;
                cards.forEach(card => {
                    if (card.classList.contains('skeleton-card')) return;
                    
                    const cardCats = card.dataset.category || '';
                    if (cat === 'all' || cardCats.includes(cat)) {
                        card.style.display = 'flex';
                        // Força a animação de entrada
                        card.classList.remove('is-visible');
                        void card.offsetWidth; // Trigger reflow
                        card.classList.add('is-visible');
                        found = true;
                    } else {
                        card.style.display = 'none';
                        card.classList.remove('is-visible');
                    }
                });
                
                const noResults = document.getElementById('no-results-message');
                if (noResults) noResults.style.display = found ? 'none' : 'block';
            });
        });
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
                        <button class="remove-item-btn" onclick="removeItem(${item.cartId})">🗑️</button>
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
                if (!user) {
                    showNotification('Faça login para finalizar.', 'info');
                    setTimeout(() => window.location.href = 'login.html', 1500);
                    return;
                }
                
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

    // ============================================================
    // MÓDULO 5: PÁGINA DE PERFIL (QG)
    // ============================================================
    if (document.querySelector('.profile-section')) {
        const user = JSON.parse(localStorage.getItem(CONFIG.localStorageUserKey));
        
        if (!user) {
            window.location.href = 'login.html';
        } else {
            document.getElementById('profile-name').textContent = `${user.firstName} ${user.lastName}`;
            document.getElementById('profile-avatar').textContent = user.firstName.charAt(0).toUpperCase();
            
            const schoolMap = { pentagono: 'Colégio Pentágono', singular: 'Colégio Singular' };
            document.getElementById('profile-school').textContent = schoolMap[user.school] || user.school || 'Não informado';
            document.getElementById('profile-grade').textContent = user.grade ? `${user.grade}º Ano` : '-';
            document.getElementById('profile-course').textContent = user.course ? user.course.charAt(0).toUpperCase() + user.course.slice(1) : '-';
            
            document.getElementById('profile-email').textContent = user.email || 'Oculto';
            document.getElementById('profile-phone').textContent = user.phone || 'Oculto';
            document.getElementById('profile-cpf').textContent = user.cpf || 'Oculto';

            document.getElementById('logout-btn-profile').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem(CONFIG.localStorageUserKey);
                window.location.href = 'login.html';
            });
        }
    }
});