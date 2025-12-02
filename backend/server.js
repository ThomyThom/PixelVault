// backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();

// --- SEGURANÇA E CONFIGURAÇÃO ---
// Restringe o acesso apenas ao teu domínio em produção.
// Em desenvolvimento (localhost), permite tudo.
const allowedOrigins = [
    'https://pixel-vault-delta.vercel.app', // Substitui pelo teu domínio real da Vercel
    'http://localhost:3000',
    'http://127.0.0.1:5500'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por CORS: A origem não é permitida.'));
        }
    },
    credentials: true
}));

app.use(express.json());

// --- PADRÃO SERVERLESS PARA MONGODB ---
// Isto é CRUCIAL para a Vercel. Evita abrir 1000 conexões e derrubar o banco.
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Desativa o buffer para falhar rápido se não houver conexão
        };

        cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
            console.log('⚡ Nova conexão ao MongoDB estabelecida.');
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

// Middleware para garantir conexão antes de qualquer rota
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('Erro crítico de conexão ao DB:', error);
        res.status(500).json({ error: 'Falha na conexão com o cofre de dados.' });
    }
});

// --- ROTAS ---
app.use('/api/auth', authRoutes);

// Rota de saúde para o Vercel não reclamar
app.get('/', (req, res) => {
    res.send('Pixel Vault API está operacional.');
});

// --- INICIALIZAÇÃO HÍBRIDA ---
// Se estiver rodando localmente, usa o app.listen.
// Se estiver na Vercel, exporta o app para o serverless function.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Servidor local a rodar na porta ${PORT}`));
}

module.exports = app;