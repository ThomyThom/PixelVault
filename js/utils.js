export function showNotification(message, type = 'success') {
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
}

export function formatPrice(value) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}