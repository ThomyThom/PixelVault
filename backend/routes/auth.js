// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ROTA DE REGISTRO: /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirm_password, school, grade, course, phone, cpf } = req.body;

        // Validações de entrada com feedback específico
        if (!firstName || !lastName || !email || !password || !school || !grade || !course || !phone || !cpf) {
            return res.status(400).json({ message: 'Por favor, preencha todos os campos obrigatórios.' });
        }
        if (password !== confirm_password) {
            return res.status(400).json({ message: 'As senhas não coincidem.' });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'A senha não cumpre os requisitos de segurança.' });
        }

        // Verificações de duplicidade com feedback específico
        let userByEmail = await User.findOne({ email });
        if (userByEmail) {
            return res.status(400).json({ message: 'Este email já possui uma chave forjada.' });
        }
        let userByCpf = await User.findOne({ cpf });
        if (userByCpf) {
            return res.status(400).json({ message: 'Este CPF já está registrado em outra conta.' });
        }
        let userByPhone = await User.findOne({ phone });
        if (userByPhone) {
            return res.status(400).json({ message: 'Este número de telefone já está em uso.' });
        }

        // Se todas as verificações passarem, cria-se a nova identidade
        const user = new User({ firstName, lastName, email, password, school, grade, course, phone, cpf });
        await user.save();

        res.status(201).json({ message: 'Chave forjada com sucesso! Bem-vindo ao clube.' });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Erro no servidor ao tentar forjar a chave.');
    }
});

// ROTA DE LOGIN: /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Mensagem genérica por segurança: não informa se o email existe ou não.
            return res.status(400).json({ message: 'Email ou senha incorretos.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Mensagem genérica por segurança.
            return res.status(400).json({ message: 'Email ou senha incorretos.' });
        }

        res.status(200).json({ 
            message: 'Acesso concedido.',
            user: {
                firstName: user.firstName
            }
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Erro no servidor ao tentar acessar o cofre.');
    }
});

module.exports = router;
