const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    title: { type: String, required: true },
    // O preço base é 20.00. O Front-end calcula os adicionais (30 e 50).
    price: { type: Number, required: true, default: 20.00 },
    image: { type: String, required: true },
    categories: [{ type: String }], // Ex: ['acao', 'rpg']
    scriptLink: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false }, // Destaque no carrossel
    isComingSoon: { type: Boolean, default: false }, // Drop Secreto (Bloqueado)
    unlocksAt: { type: Date } // Data para desbloqueio automático
}, { timestamps: true });

module.exports = mongoose.model('Game', GameSchema);