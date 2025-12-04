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

// --- ROTA: SINCRONIZAR COM DISCORD (NOVO) ---
router.post('/sync-discord', checkAdmin, async (req, res) => {
    const webhookUrl = process.env.DISCORD_CATALOG_WEBHOOK;

    if (!webhookUrl) {
        return res.status(500).json({ message: 'ERRO: Webhook do Discord não configurado na Vercel.' });
    }

    try {
        // 1. Busca todos os jogos
        const games = await Game.find().sort({ title: 1 }); // Ordem alfabética fica melhor no catálogo
        let sentCount = 0;

        // 2. Envia um por um (Loop com pausa para não tomar bloqueio do Discord)
        for (const game of games) {
            
            // Pula jogos secretos/bloqueados se quiser (ou remove esse if para postar tudo)
            // if (game.isComingSoon) continue; 

            // Formata o Card (Embed) do Discord
            const embed = {
                title: game.title,
                description: game.isComingSoon ? "🔒 **DROP SECRETO - EM BREVE**" : `🎮 **Disponível no Cofre**\n\nCategorias: _${game.categories.join(', ')}_`,
                color: game.isComingSoon ? 0 : 5763719, // Preto para secreto, Ciano (Pixel Vault) para normal
                fields: [
                    { name: "PC Pessoal", value: "R$ 20,00", inline: true },
                    { name: "PC Escola", value: "R$ 30,00", inline: true },
                    { name: "Combo", value: "R$ 50,00", inline: true }
                ],
                thumbnail: { url: game.image }, // Imagem pequena ao lado
                image: { url: game.image }, // Imagem grande (Opcional, pode remover se ficar muito grande)
                footer: { text: "Pixel Vault • Access Granted" }
            };

            // Payload para o Webhook
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: "Pixel Vault Estoque",
                    avatar_url: "https://cdn-icons-png.flaticon.com/512/6840/6840478.png", // Ícone de cofre ou seu logo
                    embeds: [embed]
                })
            });

            sentCount++;
            // Pausa de 1 segundo entre envios para o Discord não bloquear (Rate Limit)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        res.json({ message: `Sucesso! ${sentCount} jogos enviados para o Discord.` });

    } catch (error) {
        console.error("Erro na sincronização:", error);
        res.status(500).json({ message: 'Falha ao conectar com o Discord.' });
    }
});

module.exports = router;