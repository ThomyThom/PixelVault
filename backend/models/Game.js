// backend/models/Game.js
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true, default: 20.00 },
    image: { type: String, required: true },
    categories: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    // NOVO CAMPO: Define se é um Drop Futuro
    isComingSoon: { type: Boolean, default: false } 
}, { timestamps: true });

module.exports = mongoose.model('Game', GameSchema);