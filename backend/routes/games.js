// backend/routes/games.js
const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const checkAdmin = require('../middleware/checkAdmin'); // O porteiro de segurança

// ROTA PÚBLICA: Listar todos os jogos
router.get('/', async (req, res) => {
    try {
        const games = await Game.find().sort({ createdAt: -1 });
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar jogos: ' + err.message });
    }
});

// ROTA PROTEGIDA: Adicionar um novo jogo
router.post('/', checkAdmin, async (req, res) => {
    const game = new Game(req.body);
    try {
        const newGame = await game.save();
        res.status(201).json(newGame);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ROTA PROTEGIDA: Remover um jogo
router.delete('/:id', checkAdmin, async (req, res) => {
    try {
        await Game.findByIdAndDelete(req.params.id);
        res.json({ message: 'Jogo removido da existência.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ROTA PROTEGIDA: SEED COMPLETO (Reset e População)
// ATENÇÃO: Isto apaga tudo e recria os jogos iniciais. Use com cuidado.
router.post('/seed', checkAdmin, async (req, res) => {
    const initialGames = [
        { 
            title: "Cyberpunk 2077", 
            price: 20.00, 
            image: "src/img/cbp2077.jpg", 
            categories: ["acao", "rpg"],
            isFeatured: true 
        },
        { 
            title: "Elden Ring", 
            price: 20.00, 
            image: "src/img/eldenring.jpg", 
            categories: ["acao", "rpg"],
            isFeatured: true
        },
        { 
            title: "God of War Ragnarök", 
            price: 20.00, 
            image: "src/img/gow-ragnarok.jpg", 
            categories: ["acao", "aventura"],
            isFeatured: true
        },
        { 
            title: "Baldur's Gate 3", 
            price: 20.00, 
            image: "src/img/baldursgate3.jpg", 
            categories: ["rpg"],
            isFeatured: true
        },
        { 
            title: "Hollow Knight", 
            price: 20.00, 
            image: "src/img/hollowknight.jpg", 
            categories: ["indie", "aventura", "school"] 
        },
        { 
            title: "Hollow Knight: Silksong", 
            price: 20.00, 
            image: "src/img/hollowknightsilksong.jpg", 
            categories: ["indie", "aventura", "school"] 
        },
        { 
            title: "The Witcher 3", 
            price: 20.00, 
            image: "src/img/witcher3.jpg", 
            categories: ["rpg", "aventura"] 
        },
        { 
            title: "The Last of Us Part I", 
            price: 20.00, 
            image: "src/img/tlou-part1.jpg", 
            categories: ["acao", "aventura"] 
        },
        { 
            title: "Red Dead Redemption 2", 
            price: 20.00, 
            image: "src/img/rdr2.jpg", 
            categories: ["acao", "aventura"] 
        },
        { 
            title: "Disco Elysium", 
            price: 20.00, 
            image: "src/img/discoelysium.jpg", 
            categories: ["indie", "rpg", "school"] 
        },
        { 
            title: "Sekiro: Shadows Die Twice", 
            price: 20.00, 
            image: "src/img/sekiro.jpg", 
            categories: ["acao"] 
        },
        { 
            title: "Spider-Man: Miles Morales", 
            price: 20.00, 
            image: "src/img/spiderman-miles.jpg", 
            categories: ["acao", "aventura"] 
        }
    ];

    try {
        await Game.deleteMany({}); // Limpa o banco atual
        await Game.insertMany(initialGames); // Insere os novos
        res.json({ message: "O Universo foi reiniciado com sucesso! Todos os jogos padrão foram restaurados." });
    } catch (err) {
        res.status(500).json({ message: "Falha na criação do universo: " + err.message });
    }
});

module.exports = router;