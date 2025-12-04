// backend/routes/games.js
const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const checkAdmin = require('../middleware/checkAdmin');

// ROTA PÚBLICA: Listar jogos (Com verificação de tempo)
router.get('/', async (req, res) => {
    try {
        const games = await Game.find().sort({ createdAt: -1 });
        
        // LÓGICA TEMPORAL:
        // Transforma os dados para o Front-end
        const processedGames = games.map(game => {
            const gameObj = game.toObject();
            
            // Verifica se existe data de bloqueio e se ela está no futuro
            if (gameObj.unlocksAt && new Date() < new Date(gameObj.unlocksAt)) {
                gameObj.isComingSoon = true; // Força o modo "Drop Secreto"
            } else {
                gameObj.isComingSoon = false; // Libera o jogo
            }
            return gameObj;
        });

        res.json(processedGames);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar jogos: ' + err.message });
    }
});

// ROTA PROTEGIDA: Adicionar Jogo
router.post('/', checkAdmin, async (req, res) => {
    const game = new Game(req.body);
    try {
        const newGame = await game.save();
        res.status(201).json(newGame);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ROTA PROTEGIDA: Remover Jogo
router.delete('/:id', checkAdmin, async (req, res) => {
    try {
        await Game.findByIdAndDelete(req.params.id);
        res.json({ message: 'Jogo removido.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ROTA PROTEGIDA: Seed (Reset)
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
        await Game.deleteMany({});
        await Game.insertMany(initialGames);
        res.json({ message: "Universo resetado." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- ROTA: SINCRONIZAR COM DISCORD (VERSÃO TURBO / BATCH) ---
router.post('/sync-discord', checkAdmin, async (req, res) => {
    const webhookUrl = process.env.DISCORD_CATALOG_WEBHOOK;

    if (!webhookUrl) {
        return res.status(500).json({ message: 'ERRO: Webhook não configurado.' });
    }

    try {
        // 1. Busca todos os jogos
        const games = await Game.find().sort({ title: 1 }); // Ordem alfabética
        
        // 2. Prepara todos os Embeds na memória
        const allEmbeds = games.map(game => {
            // Correção de URL
            let finalImage = game.image;
            if (!finalImage) finalImage = "https://via.placeholder.com/300x400?text=Sem+Capa";
            else if (finalImage.startsWith('/')) finalImage = `https://pixelvaultshop.vercel.app${finalImage}`;

            return {
                title: game.title,
                description: game.isComingSoon 
                    ? "🔒 **CONFIDENCIAL - EM BREVE**" 
                    : `🎮 **Disponível no Cofre**\nCategorias: _${game.categories.join(', ')}_`,
                color: game.isComingSoon ? 2895667 : 5763719, // Cinza escuro ou Ciano
                fields: [
                    { name: "PC Pessoal", value: "R$ 20,00", inline: true },
                    { name: "PC Escola", value: "R$ 30,00", inline: true },
                    { name: "Combo", value: "R$ 50,00", inline: true }
                ],
                thumbnail: { url: finalImage },
                footer: { text: "Pixel Vault • Access Granted" }
            };
        });

        // 3. Divide em lotes de 10 (Limite do Discord)
        const chunkSize = 10;
        let sentCount = 0;

        for (let i = 0; i < allEmbeds.length; i += chunkSize) {
            const chunk = allEmbeds.slice(i, i + chunkSize);

            // Envia o lote inteiro (1 requisição = 10 jogos)
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: "Pixel Vault Estoque",
                    avatar_url: "https://cdn-icons-png.flaticon.com/512/6840/6840478.png",
                    embeds: chunk // Manda o array de 10 embeds
                })
            });

            sentCount += chunk.length;
            // Pequena pausa de segurança entre Lotes (não entre jogos)
            await new Promise(r => setTimeout(r, 500));
        }

        res.json({ message: `Sincronização Turbo concluída! ${sentCount} jogos enviados em pacotes.` });

    } catch (error) {
        console.error("Erro fatal na sincronização:", error);
        res.status(500).json({ message: 'Erro interno: ' + error.message });
    }
});

module.exports = router;