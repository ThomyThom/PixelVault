// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();

// --- 1. SEGURANÇA MÁXIMA (Lista de Convidados Atualizada) ---
const allowedOrigins = [
    'http://localhost:3000',          // Testes locais
    'http://127.0.0.1:5500',          // Live Server
    'https://pixelvaultshop.vercel.app' // <--- O TEU DOMÍNIO REAL AGORA ESTÁ AQUI
];

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem origem (como Postman ou Apps Mobile)
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

// --- 2. CONEXÃO MONGODB (Resiliente) ---
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

// --- 3. MIDDLEWARE DE CONEXÃO ---
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

// --- 4. ROTAS ---
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('API Pixel Vault Segura e Online 🔒');
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Servidor local na porta ${PORT}`));
}
