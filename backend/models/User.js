// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    school: { type: String, required: true },
    grade: { type: String, required: true },
    course: { type: String, required: true },
    phone: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },
}, { timestamps: true });

// O Ferreiro de Senhas: Antes de salvar um novo membro, este ritual é executado
UserSchema.pre('save', async function(next) {
    // Só executa se a senha foi modificada (ou é nova)
    if (!this.isModified('password')) {
        return next();
    }
    // Forja a senha em um hash criptografado e seguro
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', UserSchema);