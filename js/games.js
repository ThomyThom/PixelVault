import { CONFIG } from './config.js';
import { addToCart } from './cart.js';
import { formatPrice, showNotification } from './utils.js';

export async function loadGames() {
    const gameGrid = document.querySelector('.game-grid');
    if (!gameGrid) return;

    try {
        gameGrid.innerHTML = '<div class="loading-arsenal">ACESSANDO O COFRE...</div>';
        const res = await fetch(`${CONFIG.apiBaseUrl}/games`);
        if(!res.ok) throw new Error('Erro na API');
        const games = await res.json();
        
        gameGrid.innerHTML = '';

        if (games.length === 0) {
            gameGrid.innerHTML = '<p style="text-align: center; width: 100%;">Cofre vazio.</p>';
            return;
        }
        
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

        // Event Delegation: Gerencia cliques na grid (Adicionar e Info)
        gameGrid.addEventListener('click', (e) => {
            // Botão de Preço Info
            if (e.target.classList.contains('price-info-link')) {
                e.preventDefault();
                openPriceModal();
                return;
            }
            
            // Botão Adicionar
            const btn = e.target.closest('.add-cart-icon-btn');
            if (btn) {
                addToCart(btn);
            }
        });

    } catch (e) {
        console.error(e);
        gameGrid.innerHTML = '<p style="text-align: center;">Erro de conexão.</p>';
    }

    // Filtros (inicialização)
    initFilters();
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
                ADICIONAR 
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            </button>
            ` : ''}
        `;
        container.appendChild(card);

        // Evento de Mudança de Preço (Local)
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

function initFilters() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    if (categoryBtns) {
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
                        // Pequeno delay para animação
                        setTimeout(() => card.classList.add('is-visible'), 10);
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
        modal.onclick = (e) => { if(e.target===modal || e.target.classList.contains('modal-close-btn') || e.target.classList.contains('modal-close-btn-action')) modal.remove(); };
    } else {
        modal.classList.add('is-active');
    }
}