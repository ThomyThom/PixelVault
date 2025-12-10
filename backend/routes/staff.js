// backend/routes/staff.js
const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

// Middleware de Segurança (Verifica a Senha Mestra)
const verifyStaff = (req, res, next) => {
    const authHeader = req.headers['x-staff-secret'];
    const masterKey = process.env.STAFF_MASTER_KEY;

    if (!authHeader || authHeader !== masterKey) {
        return res.status(403).json({ message: 'Acesso Negado. Credencial inválida.' });
    }
    next();
};

// 1. ROTA DE LOGIN (Apenas valida se a senha está certa)
router.post('/login', verifyStaff, (req, res) => {
    res.json({ message: 'Acesso autorizado ao Arsenal.' });
});

// 2. ROTA DE DADOS (Pega os jogos liberados e links)
router.get('/data', verifyStaff, async (req, res) => {
    try {
        // Busca apenas jogos que NÃO são "Em Breve" (já lançados)
        // Se quiser todos, remova o filtro { isComingSoon: false }
        const games = await Game.find({ isComingSoon: false }).select('title image').sort({ title: 1 });
        
        res.json({
            games: games,
            steamTools: [
                { name: "GreenLuma 2024 (Injetor)", url: "https://link-do-seu-drive-ou-mega.com/greenluma" },
                { name: "Goldberg Emulator", url: "https://link-do-seu-drive.com/goldberg" },
                { name: "Steamless", url: "https://link-do-seu-drive.com/steamless" }
            ]
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar dados do arsenal.' });
    }
});

// 3. ROTA DOWNLOAD: "ULTIMO RECURSO.REG"
router.get('/download/last-resort', verifyStaff, (req, res) => {
    // Conteúdo do arquivo REG que você enviou 
    const regContent = `Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\\Directory\\shell\\LimpezaCompleta]
"Icon"="shell32.dll,-16715"
"MUIVerb"="LimpezaCompleta"
"Position"="bottom"
"NeverDefault"=""

[HKEY_CLASSES_ROOT\\Directory\\shell\\LimpezaCompleta\\command]
@="cmd.exe /c (choice /c:yn /m \\"Are you sure you want to delete everything in the folder '%1'?\\") & (if errorlevel 2 exit) & (cmd /c rd /s /q \\"%1\\" & md \\"%1\\")"

[HKEY_CLASSES_ROOT\\Directory\\Background\\shell\\LimpezaCompleta]
"Icon"="shell32.dll,-16715"
"MUIVerb"="LimpezaCompleta"
"Position"="bottom"
"NeverDefault"=""

[HKEY_CLASSES_ROOT\\Directory\\Background\\shell\\LimpezaCompleta\\command]
@="cmd.exe /c (choice /c:yn /m \\"Are you sure you want to delete everything in the folder '%V'?\\") & (if errorlevel 2 exit) & (cmd /c rd /s /q \\"%V\\" & md \\"%V\\")"`;

    res.setHeader('Content-disposition', 'attachment; filename=2_Ultimo_Recurso.reg');
    res.setHeader('Content-type', 'application/octet-stream');
    res.send(regContent);
});

// --- ROTA: TÚNEL DE DADOS (PROXY ZIP) ---
router.get('/tunnel/:id', verifyStaff, async (req, res) => {
    try {
        // 1. Busca dados
        const game = await Game.findById(req.params.id);
        if (!game || !game.scriptLink) {
            return res.status(404).send('Alvo não localizado ou sem script.');
        }

        const secretUrl = game.scriptLink;

        // 2. Baixa o arquivo secretamente
        const response = await fetch(secretUrl);
        if (!response.ok) throw new Error(`Falha na extração: ${response.statusText}`);

        // 3. FORMATAÇÃO DO NOME (Limpeza Profunda)
        // Regra: Remove : / \ ? * " < > | (ilegais no Windows)
        // Depois troca espaços por traços
        
        // 3. Formata o Nome (Igual ao Backend)
        // Ex: "Spider-Man: Miles Morales" -> "Spider-Man-Miles-Morales.zip"
        const safeName = gameTitle
            .replace(/:/g, '')           // Remove dois pontos
            .replace(/[<>"/\\|?*]/g, '') // Remove ilegais
            .trim()
            .replace(/\s+/g, '-')        // Espaço vira traço
            + '.zip';
        
        const filename = `${safeName}`;

        // 4. Cabeçalhos de Resposta (Força download ZIP)
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/zip');

        // 5. Transmite (Stream)
        const { Readable } = require('stream');
        // @ts-ignore
        const nodeStream = Readable.fromWeb(response.body);
        nodeStream.pipe(res);

    } catch (error) {
        console.error("Erro no túnel:", error);
        res.status(500).send('Erro na conexão segura. Verifique se o link é direto.');
    }
});

module.exports = router;