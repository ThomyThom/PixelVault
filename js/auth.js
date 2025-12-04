import { CONFIG } from './config.js';
import { showNotification } from './utils.js';

export function initAuthSystem() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // --- MÁSCARAS DE INPUT (CPF e Telefone) ---
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
            v = v.replace(/(\d{5})(\d)/, '$1-$2');
            e.target.value = v.slice(0, 15);
        });
    }

    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = v.slice(0, 14);
        });
    }

    if (!loginForm && !registerForm) return;

    // --- ALTERNÂNCIA LOGIN/REGISTRO ---
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    
    if(showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form-container').style.display = 'none';
            document.getElementById('register-form-container').style.display = 'block';
        });
    }
    if(showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form-container').style.display = 'none';
            document.getElementById('login-form-container').style.display = 'block';
        });
    }

    // --- VALIDAÇÃO VISUAL DE SENHA ---
    const passwordInput = document.getElementById('register-password');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const value = e.target.value;
            const reqs = {
                length: document.getElementById('req-length'),
                lowercase: document.getElementById('req-lowercase'),
                uppercase: document.getElementById('req-uppercase'),
                number: document.getElementById('req-number')
            };

            if(reqs.length) reqs.length.classList.toggle('valid', value.length >= 8);
            if(reqs.lowercase) reqs.lowercase.classList.toggle('valid', /[a-z]/.test(value));
            if(reqs.uppercase) reqs.uppercase.classList.toggle('valid', /[A-Z]/.test(value));
            if(reqs.number) reqs.number.classList.toggle('valid', /[0-9]/.test(value));
        });
    }

    // --- SUBMIT LOGIN ---
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
                if (!res.ok) throw new Error(data.message);

                sessionStorage.setItem(CONFIG.storageTokenKey, data.token);
                sessionStorage.setItem(CONFIG.storageUserKey, JSON.stringify(data.user));
                
                showNotification('Bem-vindo!', 'success');
                setTimeout(() => window.location.href = 'index.html', 1000);
            } catch (err) {
                showNotification(err.message, 'error');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // --- SUBMIT REGISTRO ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pw = document.getElementById('register-password').value;
            const cpw = document.getElementById('confirm-password').value;
            
            if (pw !== cpw) return showNotification('Senhas não conferem.', 'error');

            const btn = registerForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Criando...';
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

                sessionStorage.setItem(CONFIG.storageTokenKey, data.token);
                sessionStorage.setItem(CONFIG.storageUserKey, JSON.stringify(data.user));
                
                showNotification('Conta criada!', 'success');
                setTimeout(() => window.location.href = 'index.html', 1500);
            } catch (err) {
                showNotification(err.message, 'error');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
}