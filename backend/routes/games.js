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

// --- ROTA: SINCRONIZAR COM DISCORD (BLINDADA) ---
router.post('/sync-discord', checkAdmin, async (req, res) => {
    const webhookUrl = process.env.DISCORD_CATALOG_WEBHOOK;

    if (!webhookUrl) {
        return res.status(500).json({ message: 'ERRO: Webhook do Discord não configurado na Vercel.' });
    }

    try {
        // Busca todos os jogos
        const games = await Game.find().sort({ title: 1 });
        let sentCount = 0;
        let errorCount = 0;

        for (const game of games) {
            // --- BLINDAGEM INDIVIDUAL ---
            // Se um jogo falhar, o 'catch' abaixo pega o erro e o loop continua para o próximo.
            try {
                
                // 1. Filtro de Drop Secreto (Opcional - Descomente se quiser pular os bloqueados)
                // if (game.isComingSoon) continue; 

                // 2. Correção de Imagem (URL Absoluta ou Placeholder)
                let finalImage = game.image;
                if (!finalImage) {
                    finalImage = "https://via.placeholder.com/300x400?text=Sem+Capa"; // Fallback
                } else if (finalImage.startsWith('/')) {
                    finalImage = `https://pixelvaultshop.vercel.app${finalImage}`;
                }

                // 3. Formata o Embed
                const embed = {
                    title: game.title,
                    description: game.isComingSoon 
                        ? "🔒 **CONFIDENCIAL - EM BREVE**" 
                        : `🎮 **Disponível no Cofre**\n\nCategorias: _${game.categories.join(', ')}_`,
                    // Discord não aceita cor 0 preto puro às vezes, usamos um cinza muito escuro (0x2C2F33) ou o ciano padrão
                    color: game.isComingSoon ? 2895667 : 5763719, 
                    fields: [
                        { name: "PC Pessoal", value: "R$ 20,00", inline: true },
                        { name: "PC Escola", value: "R$ 30,00", inline: true },
                        { name: "Combo", value: "R$ 50,00", inline: true }
                    ],
                    thumbnail: { url: finalImage },
                    footer: { text: "Pixel Vault • Access Granted" }
                };

                // 4. Envio Seguro
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: "Pixel Vault Estoque",
                        avatar_url: "https://cdn-icons-png.flaticon.com/512/6840/6840478.png",
                        embeds: [embed]
                    })
                });

                // Se o Discord rejeitar (Ex: erro 400 por imagem inválida), lançamos erro para o catch individual
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Discord rejeitou: ${errText}`);
                }

                sentCount++;
                // Pausa anti-spam
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (innerError) {
                console.error(`Falha ao enviar o jogo "${game.title}":`, innerError.message);
                errorCount++;
                // O loop continua para o próximo jogo...
            }
        }

        res.json({ message: `Sincronização concluída! Enviados: ${sentCount}. Falhas: ${errorCount}. Verifique os logs para detalhes.` });

    } catch (error) {
        console.error("Erro fatal na rota de sincronização:", error);
        res.status(500).json({ message: 'Erro interno no servidor ao iniciar sincronização.' });
    }
});

module.exports = router;