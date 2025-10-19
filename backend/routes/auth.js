// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Importa o blueprint do membro

// ROTA DE REGISTRO: /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirm_password, school, grade, course, phone, cpf } = req.body;

        // Validações essenciais
        if (password !== confirm_password) {
            return res.status(400).json({ message: 'As senhas não coincidem.' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Este email já possui uma chave forjada.' });
        }

        // Cria uma nova identidade baseada no blueprint
        user = new User({ name, email, password, school, grade, course, phone, cpf });

        // Salva a nova identidade no grande livro de registros (o ritual do ferreiro de senhas será ativado)
        await user.save();

        // Responde com sucesso
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

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // Compara a senha fornecida com a senha forjada no banco de dados
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // Concede acesso (em uma próxima fase, aqui geraríamos um token JWT)
        res.status(200).json({ 
            message: 'Acesso concedido.',
            user: {
                name: user.name
            }
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Erro no servidor ao tentar acessar o cofre.');
    }
});

module.exports = router;