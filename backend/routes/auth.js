// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ROTA DE REGISTRO
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirm_password, school, grade, course, phone, cpf } = req.body;

        // Validações básicas
        if (!firstName || !lastName || !email || !password || !school || !grade || !course || !phone || !cpf) {
            return res.status(400).json({ message: 'Por favor, preencha todos os campos obrigatórios.' });
        }
        if (password !== confirm_password) {
            return res.status(400).json({ message: 'As senhas não coincidem.' });
        }
        
        // Verifica duplicidade (Email, CPF ou Telefone)
        const existingUser = await User.findOne({ $or: [{ email }, { cpf }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Usuário já cadastrado (Email, CPF ou Telefone em uso).' });
        }

        const user = new User({ firstName, lastName, email, password, school, grade, course, phone, cpf });
        await user.save();

        res.status(201).json({ 
            message: 'Registro realizado com sucesso!',
            user: { firstName, lastName, school, grade, course }
        });

    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// ROTA DE LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Dados incompletos.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        res.status(200).json({ 
            message: 'Login realizado.',
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                school: user.school,
                grade: user.grade,
                course: user.course
            }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

module.exports = router;