// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
// crypto e sgMail não são mais necessários aqui
const User = require('../models/User');

// ROTA DE REGISTRO
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirm_password, school, grade, course, phone, cpf } = req.body;

        // ... (validações de campos, senha, duplicidade permanecem)

        const user = new User({ firstName, lastName, email, password, school, grade, course, phone, cpf });
        
        // REMOVIDO: Geração de token e envio de email
        // isVerified já é true por padrão no model

        await user.save();
        
        // Mensagem de sucesso direto
        res.status(201).json({ 
            message: 'Chave forjada com sucesso! Bem-vindo ao clube.',
            user: { // Enviamos o nome para login automático no front-end
                firstName: user.firstName 
            }
        });

    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).send('Erro no servidor ao tentar forjar a chave.');
    }
});

// REMOVIDO: Rota GET /verify/:token

// ROTA DE LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email ou senha incorretos.' });
        }
        
        // REMOVIDO: Verificação de user.isVerified

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email ou senha incorretos.' });
        }

        res.status(200).json({ 
            message: 'Acesso concedido.',
            user: {
                firstName: user.firstName
            }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).send('Erro no servidor ao tentar acessar o cofre.');
    }
});

module.exports = router;
