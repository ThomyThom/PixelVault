// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // NOVO
const User = require('../models/User');

// SEGREDO DO JWT (Adicione JWT_SECRET nas variáveis da Vercel depois!)
// Em dev usa 'segredo_local', em prod usa a variável de ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto_local';

// ROTA DE REGISTRO
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirm_password, school, grade, course, phone, cpf } = req.body;

        if (!firstName || !lastName || !email || !password || !school || !cpf) {
            return res.status(400).json({ message: 'Preencha todos os campos.' });
        }
        if (password !== confirm_password) {
            return res.status(400).json({ message: 'Senhas não conferem.' });
        }
        
        const existingUser = await User.findOne({ $or: [{ email }, { cpf }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Usuário já existe.' });
        }

        const user = new User({ firstName, lastName, email, password, school, grade, course, phone, cpf });
        await user.save();

        // GERA O TOKEN
        const token = jwt.sign(
            { id: user._id, firstName: user.firstName }, // Payload (o que vai dentro do token)
            JWT_SECRET,
            { expiresIn: '1h' } // Expira em 1 hora (Segurança para escola)
        );

        res.status(201).json({ 
            message: 'Registro com sucesso!',
            token, // Envia o token
            user: { firstName: user.firstName, school: user.school } // Dados básicos para a UI
        });

    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// ROTA DE LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // GERA O TOKEN
        const token = jwt.sign(
            { id: user._id, firstName: user.firstName },
            JWT_SECRET,
            { expiresIn: '2h' } // Login dura 2 horas
        );

        res.status(200).json({ 
            message: 'Login realizado.',
            token, // O Token é a chave mestra agora
            user: { 
                firstName: user.firstName, 
                lastName: user.lastName,
                school: user.school 
            } // Apenas dados não-críticos para o cabeçalho
        });

    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// ROTA SEGURA: OBTER PERFIL (Dossiê Completo)
// O Front-end chama isso enviando o Token para ver CPF/Email
router.get('/me', async (req, res) => {
    const token = req.headers['x-auth-token'];
    
    if (!token) return res.status(401).json({ message: 'Sem token, sem acesso.' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password'); // Traz tudo menos a senha
        res.json(user);
    } catch (error) {
        res.status(401).json({ message: 'Token inválido.' });
    }
});

module.exports = router;