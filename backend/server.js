// server.js

// Importa as ferramentas do arquiteto
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Carrega as chaves secretas do nosso cofre (.env)
dotenv.config();

// Importa os mapas de rotas que criaremos
const authRoutes = require('./routes/auth');

// Inicia a construção do nosso servidor
const app = express();

// Define as pontes e regras de comunicação
app.use(cors()); // Permite que nosso front-end converse com o back-end
app.use(express.json()); // Permite que o servidor entenda o formato JSON

// Define o portal de entrada para as rotas de autenticação
app.use('/api/auth', authRoutes);

// Define a porta onde nosso servidor irá escutar, com uma opção de reserva
const PORT = process.env.PORT || 5000;

// A grande cerimônia de conexão
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conexão com o cofre do MongoDB Atlas estabelecida com sucesso.');
        // Somente após a conexão bem-sucedida, o servidor começa a operar
        app.listen(PORT, () => console.log(`Servidor operando na porta ${PORT}. O Pixel Vault está vivo.`));
    } catch (error) {
        console.error('Falha catastrófica ao conectar ao cofre:', error.message);
        process.exit(1); // Encerra a operação em caso de falha na conexão
    }
};

// Inicia a cerimônia
connectDB();