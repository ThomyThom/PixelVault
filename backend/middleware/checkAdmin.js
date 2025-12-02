// backend/middleware/checkAdmin.js
module.exports = (req, res, next) => {
    // A senha mestre deve estar no Header 'x-admin-secret'
    const secret = req.headers['x-admin-secret'];
    const envSecret = process.env.ADMIN_SECRET;

    // Se não houver senha configurada no servidor, bloqueia tudo por segurança
    if (!envSecret) {
        return res.status(500).json({ message: 'ERRO DE SEGURANÇA: ADMIN_SECRET não configurado no servidor.' });
    }

    if (secret === envSecret) {
        next(); // Senha correta, pode passar
    } else {
        res.status(403).json({ message: 'Acesso Negado: Você não tem credenciais de Mestre.' });
    }
};