document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DE AUTENTICAÇÃO E UI (REAL) ---
    const loginLink = document.getElementById('login-link');
    const userNavItems = document.querySelectorAll('.user-nav');
    const userNameLink = document.getElementById('user-name-link');
    const logoutLink = document.getElementById('logout-link');

    function checkLoginState() {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            if(loginLink) loginLink.style.display = 'none';
            if(userNameLink) userNameLink.textContent = loggedInUser;
            userNavItems.forEach(item => {
                if(item) item.style.display = 'block';
            });
        } else {
            if(loginLink) loginLink.style.display = 'block';
            userNavItems.forEach(item => {
                if(item) item.style.display = 'none';
            });
        }
    }
    
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('loggedInUser');
            showNotification('Sessão encerrada. Até a próxima!');
            setTimeout(() => window.location.href = 'index.html', 1000);
        });
    }

    // --- LÓGICA DA PÁGINA DE LOGIN (CONECTADA AO BACK-END) ---
    const loginFormContainer = document.getElementById('login-form-container');

    if (loginFormContainer) { // Roda apenas na página login.html
        const registerFormContainer = document.getElementById('register-form-container');
        const showRegisterLink = document.getElementById('show-register');
        const showLoginLink = document.getElementById('show-login');
        const registerForm = document.getElementById('register-form');

        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginFormContainer.style.display = 'none';
            registerFormContainer.style.display = 'block';
        });

        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerFormContainer.style.display = 'none';
            loginFormContainer.style.display = 'block';
        });

        // --- FORMATAÇÃO AUTOMÁTICA DE CAMPOS ---
        const cpfInput = document.getElementById('cpf');
        const phoneInput = document.getElementById('phone');

        cpfInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        });

        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/^(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });

        // --- VALIDAÇÃO DE SENHA EM TEMPO REAL ---
        const passwordInput = document.getElementById('register-password');
        const reqs = {
            length: document.getElementById('req-length'),
            lowercase: document.getElementById('req-lowercase'),
            uppercase: document.getElementById('req-uppercase'),
            number: document.getElementById('req-number')
        };
        let passwordIsValid = false;

        passwordInput.addEventListener('input', () => {
            const value = passwordInput.value;
            const validations = {
                length: value.length >= 8,
                lowercase: /[a-z]/.test(value),
                uppercase: /[A-Z]/.test(value),
                number: /[0-9]/.test(value)
            };

            reqs.length.classList.toggle('valid', validations.length);
            reqs.lowercase.classList.toggle('valid', validations.lowercase);
            reqs.uppercase.classList.toggle('valid', validations.uppercase);
            reqs.number.classList.toggle('valid', validations.number);

            passwordIsValid = Object.values(validations).every(Boolean);
        });

        // --- CONEXÃO REAL: LOGIN ---
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Erro ao tentar entrar.');
                }

                localStorage.setItem('loggedInUser', data.user.firstName);
                window.location.href = 'index.html';

            } catch (error) {
                showNotification(error.message, 'error');
            }
        });

        // --- CONEXÃO REAL: REGISTRO ---
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!passwordIsValid) {
                showNotification('Por favor, cumpra todos os requisitos da senha.', 'error');
                return;
            }

            const firstName = document.getElementById('register-firstName').value;
            const lastName = document.getElementById('register-lastName').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirm_password = document.getElementById('confirm-password').value;
            const school = document.getElementById('school').value;
            const grade = document.getElementById('grade').value;
            const course = document.getElementById('course').value;
            const phone = document.getElementById('phone').value;
            const cpf = document.getElementById('cpf').value;

            if (password !== confirm_password) {
                showNotification('As senhas não coincidem.', 'error');
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firstName, lastName, email, password, confirm_password, school, grade, course, phone, cpf })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Erro ao registrar.');
                }

                showNotification(data.message, 'success');
                registerForm.reset();
                showLoginLink.click();

            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }

    // --- FUNÇÕES DE UI ---
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    }

    // --- LÓGICA DO MODAL DE LOGIN ---
    const loginModalOverlay = document.getElementById('login-modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalActionBtn = document.getElementById('modal-action-btn');

    function openLoginModal() {
        if (loginModalOverlay) loginModalOverlay.classList.add('is-active');
    }
    function closeLoginModal() {
        if (loginModalOverlay) loginModalOverlay.classList.remove('is-active');
    }

    if (loginModalOverlay) {
        modalCloseBtn.addEventListener('click', closeLoginModal);
        modalActionBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
        loginModalOverlay.addEventListener('click', (e) => {
            if (e.target === loginModalOverlay) {
                closeLoginModal();
            }
        });
    }

    // --- CABEÇALHO INTELIGENTE (SMART HEADER) ---
    const header = document.querySelector('.site-header');
    if (header) {
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            if (window.scrollY > lastScrollY && window.scrollY > 150) {
                header.classList.add('site-header--scrolled');
            } else if (window.scrollY < lastScrollY) {
                header.classList.remove('site-header--scrolled');
            }
            lastScrollY = window.scrollY;
        });
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
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('is-active');
            nav.classList.toggle('is-active');
        });
    }

    // --- FILTROS E PESQUISA ---
    const searchBar = document.getElementById('search-bar');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const gameCards = document.querySelectorAll('.game-card');
    const noResultsMessage = document.getElementById('no-results-message');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    let activeCategory = 'all';
    const initialVisibleCount = 8;
    
    function filterAndShowGames() {
        if (!searchBar) return;
        const searchTerm = searchBar.value.toLowerCase();
        let visibleGames = [];

        gameCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const category = card.dataset.category;
            const searchMatch = title.includes(searchTerm);
            const categoryMatch = activeCategory === 'all' || category.includes(activeCategory);

            card.style.display = 'none';
            card.classList.remove('is-visible');
            if (searchMatch && categoryMatch) {
                visibleGames.push(card);
            }
        });

        visibleGames.forEach((card, index) => {
            if (index < initialVisibleCount) {
                card.style.display = 'block';
                setTimeout(() => card.classList.add('is-visible'), 10);
            }
        });

        if (noResultsMessage) noResultsMessage.style.display = visibleGames.length === 0 ? 'block' : 'none';
        if (loadMoreBtn) loadMoreBtn.style.display = visibleGames.length > initialVisibleCount ? 'inline-block' : 'none';
        
        observeAnimatedElements();
    }

    if (searchBar) searchBar.addEventListener('input', filterAndShowGames);
    if (categoryBtns.length > 0) {
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                activeCategory = btn.dataset.category;
                filterAndShowGames();
            });
        });
    }

    // --- LÓGICA "CARREGAR MAIS" ---
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            const hiddenCards = Array.from(document.querySelectorAll('.game-card')).filter(card => card.style.display === 'none');
            hiddenCards.forEach(card => {
                card.style.display = 'block';
                 setTimeout(() => card.classList.add('is-visible'), 10);
            });
            loadMoreBtn.style.display = 'none';
            observeAnimatedElements();
        });
    }

    // --- LÓGICA DO CARRINHO ---
    const cartIcon = document.getElementById('cart-icon');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');
    const addToCartBtns = document.querySelectorAll('.add-cart-icon-btn');
    const checkoutBtn = document.querySelector('.checkout-btn');

    let cart = [];

    if (cartIcon) cartIcon.addEventListener('click', () => cartOverlay.classList.add('is-active'));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('is-active'));
    if (cartOverlay) cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) cartOverlay.classList.remove('is-active');
    });

    if (addToCartBtns.length > 0) {
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
    }

    function updateCart() {
        if (!cartItemsContainer) return;
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
        
        if (cartCountEl) cartCountEl.textContent = cart.length;
        if (cartTotalEl) cartTotalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idToRemove = e.target.dataset.id;
                cart = cart.filter(item => item.id !== idToRemove);
                updateCart();
            });
        });
    }
    
    // --- LÓGICA DE CHECKOUT (COM MODAL) ---
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const loggedInUser = localStorage.getItem('loggedInUser');

            if (!loggedInUser) {
                openLoginModal();
                return;
            }

            if (cart.length === 0) {
                showNotification('Seu carrinho está vazio!', 'error');
                return;
            }
    
            const phoneNumber = '5511914521982';
            let message = 'E aí! Vim pelo site e quero levar os seguintes jogos:\n\n';
            let total = 0;
    
            cart.forEach(item => {
                message += `- ${item.title}\n`;
                total += item.price;
            });
    
            message += `\nO valor total ficou R$ ${total.toFixed(2).replace('.', ',')}. Como posso realizar o pagamento?`;
    
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
            window.open(whatsappUrl, '_blank');
        });
    }

    // --- FEED DE ATIVIDADE AO VIVO ---
    const liveFeedContainer = document.getElementById('live-feed-container');
    if (liveFeedContainer) {
        const fakeNames = ["Lucas", "Julia", "Matheus", "Beatriz", "Gabriel", "Mariana", "Pedro", "Ana", "Rafael", "Larissa"];
        const gameTitles = Array.from(document.querySelectorAll('.game-card h3')).map(h3 => h3.textContent);

        function createFakePurchaseNotification() {
            if(gameTitles.length === 0) return;
            const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
            const game = gameTitles[Math.floor(Math.random() * gameTitles.length)];
    
            const notification = document.createElement('div');
            notification.className = 'feed-notification';
            
            const avatarLetter = name.charAt(0);
    
            notification.innerHTML = `
                <div class="avatar" aria-hidden="true">${avatarLetter}</div>
                <div class="text-content">
                    <strong>${name}</strong>
                    <span>acabou de pegar <span class="game-title">${game}</span></span>
                </div>
            `;
            
            liveFeedContainer.appendChild(notification);
    
            setTimeout(() => notification.classList.add('show'), 100);
    
            setTimeout(() => {
                notification.classList.remove('show');
                notification.addEventListener('transitionend', () => notification.remove());
            }, 5000);
        }

        function startLiveFeed() {
            const randomDelay = Math.random() * (8000 - 4000) + 4000;
            setTimeout(() => {
                createFakePurchaseNotification();
                startLiveFeed();
            }, randomDelay);
        }
    }

    // --- CHAMADAS INICIAIS ---
    checkLoginState();
    
    if (document.querySelector('.game-grid')) {
      filterAndShowGames();
      if(liveFeedContainer) startLiveFeed();
    }
});