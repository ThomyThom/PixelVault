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
        initHeaderEvents(); // Ativa os eventos do menu
    }

    // 2. FUNÇÃO DE NOTIFICAÇÃO
    window.showNotification = function(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        const note = document.createElement('div');
        note.className = `notification ${type} show`;
        note.textContent = message;
        container.appendChild(note);
        setTimeout(() => note.remove(), 3000);
    };

    // 3. LÓGICA DO HEADER (Login, Menu Mobile)
    function initHeaderEvents() {
        // Mobile Menu
        const toggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.main-nav');
        if (toggle && nav) {
            toggle.addEventListener('click', () => {
                nav.classList.toggle('is-active');
            });
        }

        // Auth State
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

        // Cart Count
        updateCartCount();
    }

    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
        const el = document.getElementById('cart-count');
        if(el) el.textContent = cart.length;
    }

    // 4. CARREGAR JOGOS (Apenas na Home)
    const gameGrid = document.querySelector('.game-grid');
    if (gameGrid) {
        try {
            gameGrid.innerHTML = '<p style="text-align:center; width:100%;">Acessando o cofre...</p>';
            const res = await fetch(`${CONFIG.apiBaseUrl}/games`);
            if(!res.ok) throw new Error('Erro na API');
            const games = await res.json();
            
            gameGrid.innerHTML = ''; // Limpa loading

            if(games.length === 0) {
                gameGrid.innerHTML = '<p>Nenhum jogo encontrado.</p>';
            } else {
                games.forEach(game => {
                    // Se for "Coming Soon", mostra bloqueado
                    const isLocked = game.isComingSoon;
                    const card = document.createElement('div');
                    card.className = `game-card animate-on-scroll ${isLocked ? 'locked' : ''}`;
                    card.dataset.category = game.categories ? game.categories.join(' ') : '';
                    
                    let btnHtml = '';
                    if (!isLocked) {
                        btnHtml = `<button class="add-cart-icon-btn" data-id="${game._id}" data-title="${game.title}" data-price="${game.price}" data-img="${game.image}">+</button>`;
                    }

                    card.innerHTML = `
                        ${isLocked ? '<div class="lock-overlay"><span class="lock-text">EM BREVE</span></div>' : ''}
                        <img src="${game.image}" alt="${game.title}">
                        <div class="card-content">
                            <h3>${game.title}</h3>
                            <div class="price">${isLocked ? '???' : 'R$ ' + game.price.toFixed(2)}</div>
                        </div>
                        ${btnHtml}
                    `;
                    gameGrid.appendChild(card);
                });

                // Adicionar ao Carrinho (Event Delegation)
                gameGrid.addEventListener('click', (e) => {
                    if(e.target.classList.contains('add-cart-icon-btn')) {
                        const btn = e.target;
                        const item = {
                            id: btn.dataset.id,
                            title: btn.dataset.title,
                            price: parseFloat(btn.dataset.price),
                            imageSrc: btn.dataset.img
                        };
                        
                        let cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
                        if(!cart.find(i => i.id === item.id)) {
                            cart.push(item);
                            localStorage.setItem(CONFIG.localStorageCartKey, JSON.stringify(cart));
                            updateCartCount();
                            showNotification(`${item.title} adicionado!`);
                        } else {
                            showNotification('Já está no carrinho', 'info');
                        }
                    }
                });
            }
        } catch (e) {
            console.error(e);
            gameGrid.innerHTML = '<p>Erro ao carregar jogos. Verifique a conexão.</p>';
        }
    }

    // 5. BOTÃO DE COMPARTILHAR (Lógica Robusta)
    // Usamos 'document' para garantir que pegamos o clique mesmo se o DOM mudar
    document.addEventListener('click', (e) => {
        // Verifica se clicou no botão ou no ícone dentro dele
        const shareBtn = e.target.closest('#share-button'); 
        
        if (shareBtn) {
            e.preventDefault();
            const text = "Olha essa loja de jogos para a escola: " + window.location.origin;
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    });

    // 6. CARRINHO (Página Carrinho)
    const cartList = document.querySelector('.cart-items-list');
    if (cartList) {
        const cart = JSON.parse(localStorage.getItem(CONFIG.localStorageCartKey)) || [];
        const totalEl = document.getElementById('cart-total');
        
        if (cart.length === 0) {
            cartList.innerHTML = '<p>Seu carrinho está vazio.</p>';
        } else {
            let total = 0;
            cart.forEach(item => {
                total += item.price;
                cartList.innerHTML += `
                    <div class="cart-item" style="display:flex; gap:15px; margin-bottom:15px; background:rgba(0,0,0,0.3); padding:10px;">
                        <img src="${item.imageSrc}" style="width:60px; height:60px; object-fit:cover;">
                        <div>
                            <h4>${item.title}</h4>
                            <p>R$ ${item.price.toFixed(2)}</p>
                        </div>
                        <button class="remove-btn" onclick="removeItem('${item.id}')" style="color:red; background:none; border:none; margin-left:auto; cursor:pointer;">X</button>
                    </div>
                `;
            });
            if(totalEl) totalEl.textContent = `R$ ${total.toFixed(2)}`;
        }

        // Função global para remover (necessária para o onclick inline acima)
        window.removeItem = function(id) {
            const newCart = cart.filter(i => i.id !== id);
            localStorage.setItem(CONFIG.localStorageCartKey, JSON.stringify(newCart));
            window.location.reload();
        };

        // Checkout
        const checkoutBtn = document.querySelector('.checkout-btn');
        if(checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const user = JSON.parse(localStorage.getItem(CONFIG.localStorageUserKey));
                if(!user) return window.location.href = 'login.html';
                
                let msg = `Olá, sou ${user.firstName}. Quero comprar: \n`;
                cart.forEach(i => msg += `- ${i.title}\n`);
                window.open(`https://wa.me/5511914521982?text=${encodeURIComponent(msg)}`, '_blank');
            });
        }
    }
});