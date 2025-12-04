// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Nativo do Node.js
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'segredo_local';

// --- CONFIGURAÇÃO EMAILJS (Backend) ---
// Adicione estas variáveis no painel da Vercel!
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID; 
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY; // Opcional, mas recomendado para segurança

// ROTA 1: ESQUECI A SENHA (Gera Token e Envia Email)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // Por segurança, não dizemos que o email não existe (evita varredura de usuários)
            return res.status(200).json({ message: 'Se o email existir, as instruções foram enviadas.' });
        }

        // 1. Gerar Token Aleatório
        const token = crypto.randomBytes(20).toString('hex');

        // 2. Salvar Token e Validade (1 hora) no Banco
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
        await user.save();

        // 3. Link de Recuperação
        // ATENÇÃO: Ajuste a URL base para o seu domínio real na Vercel
        const resetUrl = `https://pixelvaultshop.vercel.app/reset-password.html?token=${token}`;

        // 4. Enviar Email via EmailJS API (Server-Side)
        const emailData = {
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            accessToken: EMAILJS_PRIVATE_KEY,
            template_params: {
                to_email: user.email,
                to_name: user.firstName,
                reset_link: resetUrl
            }
        };

        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });

        res.status(200).json({ message: 'Email enviado.' });

    } catch (error) {
        console.error('Erro no Forgot Password:', error);
        res.status(500).json({ message: 'Erro ao processar solicitação.' });
    }
});

// ROTA 2: REDEFINIR SENHA (Recebe Token e Nova Senha)
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'As senhas não coincidem.' });
        }

        // Busca usuário com token válido e que não expirou
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        // Atualiza a senha (o pre-save hook do User.js vai fazer o hash)
        user.password = newPassword;
        user.resetPasswordToken = undefined; // Limpa o token
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Senha alterada com sucesso! Faça login.' });

    } catch (error) {
        console.error('Erro no Reset Password:', error);
        res.status(500).json({ message: 'Erro ao redefinir senha.' });
    }
});

// --- ROTA 3: SOLICITAR ESCOLA (Blindada) ---
router.post('/request-school', async (req, res) => {
    try {
        const data = req.body;

        // Mapeamento EXATO para o seu Template HTML
        const emailParams = {
            school_name: data.school_name,
            school_address: data.school_address,
            school_city: data.school_city,
            school_state: data.school_state, // Agora enviado separado para caber no HTML
            school_cep: data.school_cep,
            education_level: data.education_level || 'Não informado',
            
            // Converte o checkbox (true/false) para texto legível
            has_computers: data.has_computers ? 'Sim' : 'Não',
            computer_type: data.computer_type || 'Não especificado',
            
            user_name: data.user_name,
            user_email: data.user_email,
            user_phone: data.user_phone
        };

        // Envia para o EmailJS
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: process.env.EMAILJS_TEMPLATE_ID, 
                user_id: process.env.EMAILJS_PUBLIC_KEY,
                accessToken: process.env.EMAILJS_PRIVATE_KEY,
                template_params: emailParams
            })
        });

        res.status(200).json({ message: 'Solicitação enviada com sucesso!' });

    } catch (error) {
        console.error('Erro ao enviar solicitação de escola:', error);
        res.status(500).json({ message: 'Erro interno ao processar o envio.' });
    }
});

// ... (MANTENHA AS ROTAS DE REGISTER, LOGIN E ME ABAIXO IGUAIS AO ANTERIOR) ...
// ROTA DE REGISTRO
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirm_password, school, grade, course, phone, cpf } = req.body;

        if (!firstName || !lastName || !email || !password || !school || !grade || !course || !phone || !cpf) {
            return res.status(400).json({ message: 'Por favor, preencha todos os campos obrigatórios.' });
        }
        if (password !== confirm_password) {
            return res.status(400).json({ message: 'As senhas não coincidem.' });
        }
        
        const emailExists = await User.findOne({ email });
        if (emailExists) return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });

        const cpfExists = await User.findOne({ cpf });
        if (cpfExists) return res.status(400).json({ message: 'Este CPF já está em uso.' });

        const phoneExists = await User.findOne({ phone });
        if (phoneExists) return res.status(400).json({ message: 'Este telefone já está em uso.' });

        const user = new User({ firstName, lastName, email, password, school, grade, course, phone, cpf });
        await user.save();

        const token = jwt.sign({ id: user._id, firstName: user.firstName }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: 'Registro com sucesso!', token, user: { firstName: user.firstName, school: user.school } });

    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// ROTA DE LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email e senha obrigatórios.' });

        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Email ou senha incorretos.' });
        }

        const token = jwt.sign({ id: user._id, firstName: user.firstName }, JWT_SECRET, { expiresIn: '2h' });

        res.status(200).json({ 
            message: 'Acesso concedido.', 
            token, 
            user: { 
                firstName: user.firstName, lastName: user.lastName, email: user.email, 
                school: user.school, grade: user.grade, course: user.course, 
                phone: user.phone, cpf: user.cpf 
            } 
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

router.get('/me', async (req, res) => {
    const token = req.headers['x-auth-token'];
    if (!token) return res.status(401).json({ message: 'Sem token.' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(401).json({ message: 'Token inválido.' });
    }
});

module.exports = router;