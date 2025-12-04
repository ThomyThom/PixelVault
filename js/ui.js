import { CONFIG } from './config.js';
import { updateCartCount } from './cart.js';
import { debounce } from './utils.js';

export function initUI() {
    // 1. INJEÇÃO DO HEADER
    const headerEl = document.querySelector('.site-header');
    if (headerEl && headerEl.innerHTML.trim() === '') {
        headerEl.innerHTML = `
            <div class="container">
                <a href="index.html" class="logo">Pixel Vault</a>
                <div class="search-container"><input type="search" id="search-bar" placeholder="Buscar jogos..."></div>
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
                    <a href="carrinho.html" class="cart-icon"><span class="cart-count" id="cart-count">0</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    </a>
                    <a href="login.html" id="user-profile-icon" class="user-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </a>
                </div>
                <button class="mobile-menu-toggle"><span></span><span></span><span></span></button>
            </div>
        `;
        initHeaderEvents();
    }

    // 2. BOTÃO DE COMPARTILHAR (Global)
    document.addEventListener('click', (e) => {
        const shareBtn = e.target.closest('#share-button'); 
        if (shareBtn) {
            e.preventDefault();
            const text = "Pixel Vault: A loja de jogos oficial da galera. Confere aí: " + window.location.origin;
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    });

    // 3. OBSERVADOR DE RODAPÉ (Para levantar o botão share)
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

    // 4. PERFIL DO USUÁRIO
    initProfilePage();
}

function initHeaderEvents() {
    // Ocultar barra de pesquisa em páginas internas
    if (!document.querySelector('.game-showcase')) {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) searchContainer.style.display = 'none';
    }

    const user = JSON.parse(sessionStorage.getItem(CONFIG.storageUserKey));
    const token = sessionStorage.getItem(CONFIG.storageTokenKey);
    const loginLink = document.getElementById('login-link');
    const userNavs = document.querySelectorAll('.user-nav');
    const profileIcon = document.getElementById('user-profile-icon');
    const nameLink = document.getElementById('user-name-link');

    if (user && token && user.firstName) {
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
            sessionStorage.clear();
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

    // Pesquisa Dinâmica (Visual)
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', debounce((e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.game-card');
            let found = false;
            
            cards.forEach(card => {
                if(card.classList.contains('skeleton-card')) return;
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

// Lógica da Página de Perfil
async function initProfilePage() {
    if (!document.querySelector('.profile-section')) return;

    const user = JSON.parse(sessionStorage.getItem(CONFIG.storageUserKey));
    const token = sessionStorage.getItem(CONFIG.storageTokenKey);
    
    if (!user || !token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch(`${CONFIG.apiBaseUrl}/auth/me`, { 
            headers: { 'x-auth-token': token } 
        });
        const userData = await res.json();
        
        document.getElementById('profile-name').textContent = `${userData.firstName} ${userData.lastName}`;
        document.getElementById('profile-avatar').textContent = userData.firstName.charAt(0).toUpperCase();
        
        const schoolMap = { 'pentagono': 'Colégio Pentágono', 'singular': 'Colégio Singular', 'not-listed': 'Outra' };
        document.getElementById('profile-school').textContent = schoolMap[userData.school] || userData.school;
        
        document.getElementById('profile-grade').textContent = userData.grade ? `${userData.grade}º Ano` : '-';
        
        const courseMap = { 'informatica': 'Informática', 'academico': 'Acadêmico', 'mecatronica': 'Mecatrônica', 'midias': 'Mídias', 'quimica': 'Química', 'administracao': 'Administração' };
        document.getElementById('profile-course').textContent = courseMap[userData.course] || userData.course;
        
        document.getElementById('profile-email').textContent = userData.email || '-';
        document.getElementById('profile-phone').textContent = userData.phone || '-';
        document.getElementById('profile-cpf').textContent = userData.cpf || '-';

        document.getElementById('logout-btn-profile').addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = 'login.html';
        });
    } catch (e) {
        console.error(e);
    }
}