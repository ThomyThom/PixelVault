// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet'); // Segurança de Headers
const rateLimit = require('express-rate-limit'); // Controle de tentativas

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();

// --- 1. SEGURANÇA (CORS) ---
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'https://pixelvaultshop.vercel.app' 
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'A política de CORS deste site não permite acesso a partir da origem especificada: ' + origin;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use(express.json());
// --- BLINDAGEM DE SEGURANÇA ---
app.use(helmet()); // Protege headers HTTP

// Limitador de tentativas (Evita Força Bruta)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP
    message: { message: 'Muitas tentativas. Tente novamente mais tarde.' }
});
app.use('/api/auth', limiter); // Aplica apenas nas rotas de autenticação

// --- 2. CONEXÃO MONGODB ---
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI ausente nas variáveis de ambiente!');
        }

        cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
            console.log('⚡ MongoDB Conectado!');
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("Erro ao conectar no Mongo:", e);
        throw e;
    }

    return cached.conn;
}

// Middleware de Conexão
app.use(async (req, res, next) => {
    if (req.path === '/favicon.ico') return res.status(204).end();
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('Erro Fatal de DB:', error);
        res.status(500).json({ error: 'Erro interno de conexão com o banco.' });
    }
});

// --- 3. ROTAS ---
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games'); // <--- NOVA ROTA
const staffRoutes = require('./routes/staff');


app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes); // <--- REGISTRO DA ROTA
app.use('/api/staff', staffRoutes);
app.get('/', (req, res) => {
    res.send('API Pixel Vault Online 🚀');
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Servidor local na porta ${PORT}`));
}