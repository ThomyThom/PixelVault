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
    phone: { type: String, required: true, unique: true },
    cpf: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false }, // NOVO
    emailVerificationToken: { type: String, select: false }, // NOVO (select: false para não enviar na resposta da API)
    emailVerificationExpires: { type: Date, select: false }, // NOVO
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', UserSchema);