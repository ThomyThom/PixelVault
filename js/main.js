import { initUI } from './ui.js';
import { initAuthSystem } from './auth.js';
import { loadGames } from './games.js';
import { initCart } from './cart.js';

document.addEventListener('DOMContentLoaded', () => {
    initUI();      // Header, Footer, Perfil
    initAuthSystem(); // Login/Registro
    loadGames();   // Vitrine de Jogos
    initCart();    // Página do Carrinho
});