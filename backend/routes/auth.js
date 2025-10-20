// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const User = require('../models/User');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

        // Gera o token de verificação
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // Expira em 10 minutos

        await user.save();
        
        // Envia o e-mail de verificação
        const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;
        const msg = {
            to: user.email,
            from: 'seu-email-verificado@sendgrid.com', // IMPORTANTE: Use um e-mail verificado como remetente no SendGrid
            subject: 'Confirme sua Chave para o Pixel Vault',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #020a1a; color: #e0e0e0;">
                    <h1 style="color: #00ffff; text-shadow: 0 0 5px #00ffff;">Bem-vindo ao Pixel Vault!</h1>
                    <p style="font-size: 16px;">Para finalizar a forja da sua chave, por favor clique no link a seguir.</p>
                    <p style="font-size: 12px;">(Este link é válido por 10 minutos)</p>
                    <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #00ffff; color: #020a1a; text-decoration: none; border-radius: 5px; font-weight: bold;">Verificar Email</a>
                    <p style="font-size: 12px; color: #aaa;">Se você não solicitou este registro, pode ignorar este email.</p>
                </div>
            `,
        };
        await sgMail.send(msg);

        res.status(200).json({ message: 'Registro quase completo! Um link de ativação foi enviado para o seu email.' });

    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).send('Erro no servidor ao tentar forjar a chave.');
    }
});

// ROTA DE VERIFICAÇÃO DE EMAIL
router.get('/verify/:token', async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({ 
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return res.redirect('/erro-verificacao.html');
        }

        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.redirect('/verificacao.html');

    } catch (error) {
        console.error("Erro na verificação:", error);
        res.redirect('/erro-verificacao.html');
    }
});

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

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Sua conta ainda não foi verificada. Por favor, cheque seu email.' });
        }

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