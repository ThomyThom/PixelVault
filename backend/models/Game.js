// backend/models/Game.js
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true, default: 20.00 },
    image: { type: String, required: true },
    categories: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    // NOVO CAMPO: Data de liberação automática
    unlocksAt: { type: Date, default: null } 
}, { timestamps: true });

module.exports = mongoose.model('Game', GameSchema);