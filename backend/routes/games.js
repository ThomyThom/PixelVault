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

// --- ROTA: SINCRONIZAR COM DISCORD (SANITIZAÇÃO EXTREMA) ---
router.post('/sync-discord', checkAdmin, async (req, res) => {
    const webhookUrl = process.env.DISCORD_CATALOG_WEBHOOK;

    if (!webhookUrl) {
        return res.status(500).json({ message: 'ERRO: Webhook não configurado.' });
    }

    try {
        // Busca jogos
        const games = await Game.find().sort({ title: 1 });
        
        // PREPARAÇÃO E LIMPEZA DE DADOS
        const allEmbeds = games.map(game => {
            // 1. Limpeza de Texto (Trim remove espaços extras)
            const cleanTitle = (game.title || "Título Desconhecido").trim();
            const cleanCats = (game.categories || []).join(', ') || "Geral";

            // 2. Limpeza de Imagem (A Mais Importante)
            let imgUrl = (game.image || "").trim();
            
            // Se estiver vazia ou inválida, usa placeholder
            if (!imgUrl || imgUrl.length < 5) {
                imgUrl = "https://via.placeholder.com/300x400?text=Sem+Capa";
            } 
            // Se for caminho relativo, monta a URL completa
            else if (!imgUrl.startsWith('http')) {
                // Remove barras duplas ou invertidas
                let cleanPath = imgUrl.replace(/\\/g, '/'); // Troca \ por /
                if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
                
                // Codifica espaços e caracteres especiais (ex: "God of War.jpg" -> "God%20of%20War.jpg")
                // encodeURI ignora barras /, encodeURIComponent não. Aqui queremos encodeURI.
                imgUrl = `https://pixelvaultshop.vercel.app/${encodeURI(cleanPath)}`;
            }

            // 3. Monta o Objeto
            return {
                title: cleanTitle.substring(0, 256), // Limite Discord
                description: game.isComingSoon 
                    ? "🔒 **CONFIDENCIAL - EM BREVE**" 
                    : `🎮 **Disponível no Cofre**\nCategorias: _${cleanCats}_`,
                color: game.isComingSoon ? 2829617 : 5763719, // Cores seguras
                fields: [
                    { name: "PC Pessoal", value: "R$ 20,00", inline: true },
                    { name: "PC Escola", value: "R$ 30,00", inline: true },
                    { name: "Combo", value: "R$ 50,00", inline: true }
                ],
                thumbnail: { url: imgUrl },
                footer: { text: "Pixel Vault • Access Granted" }
            };
        });

        // Envia em lotes de 4 (Segurança de Payload)
        const chunkSize = 4;
        let sentCount = 0;
        let errorLog = [];

        for (let i = 0; i < allEmbeds.length; i += chunkSize) {
            const chunk = allEmbeds.slice(i, i + chunkSize);

            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: "Pixel Vault Estoque",
                        avatar_url: "https://cdn-icons-png.flaticon.com/512/6840/6840478.png",
                        embeds: chunk
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    // LOG DETALHADO PARA VOCÊ ACHAR O CULPADO
                    console.error(`[ERRO DISCORD] Lote ${i/chunkSize + 1} falhou.`);
                    console.error(`Resposta: ${errText}`);
                    console.error(`Dados enviados:`, JSON.stringify(chunk, null, 2));
                    
                    errorLog.push(`Lote ${i/chunkSize + 1}: Discord recusou os dados.`);
                } else {
                    sentCount += chunk.length;
                }

                await new Promise(r => setTimeout(r, 1000));

            } catch (e) {
                console.error(`[ERRO REDE] Lote ${i}:`, e);
                errorLog.push(`Lote ${i/chunkSize + 1}: Erro de conexão.`);
            }
        }

        if (errorLog.length > 0) {
            res.status(207).json({ 
                message: `Parcial: ${sentCount} enviados. Falhas detectadas nos lotes: ${errorLog.length}. Veja os logs da Vercel para identificar os jogos problemáticos.` 
            });
        } else {
            res.json({ message: `Sucesso absoluto! ${sentCount} jogos sincronizados.` });
        }

    } catch (error) {
        console.error("Erro fatal:", error);
        res.status(500).json({ message: 'Erro interno: ' + error.message });
    }
});

module.exports = router;


