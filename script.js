document.addEventListener('DOMContentLoaded', () => {

    // --- Animação 3D nos Cards ---
    const cards = document.querySelectorAll('.game-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -7; // Inverte para rotação natural
            const rotateY = ((x - centerX) / centerX) * 7;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        });
    });

    // --- Animação de Entrada ao Rolar (Scroll) ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // Ativa quando 10% do elemento está visível
    });

    animatedElements.forEach(el => {
        observer.observe(el);
    });
    
    // --- Animação de Entrada ao Carregar (Load) ---
    const loadAnimatedElements = document.querySelectorAll('.animate-on-load');
    loadAnimatedElements.forEach((el, index) => {
        el.style.setProperty('--i', index);
        // A transição já está no CSS, apenas adicionamos a classe para ativar
        setTimeout(() => {
            el.classList.add('is-visible');
        }, 100);
    });

    // --- Menu Mobile ---
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('is-active');
        nav.classList.toggle('is-active');
    });

});
