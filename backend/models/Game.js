const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true, default: 20.00 },
    image: { type: String, required: true }, // URL da imagem
    categories: [{ type: String }], // Ex: ['acao', 'rpg']
    featured: { type: Boolean, default: false } // Para aparecer no topo
}, { timestamps: true });

module.exports = mongoose.model('Game', GameSchema);