const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' } // Changed to 'admin' to match your verifyAdmin check
});

// Hash password before saving
AdminSchema.pre('save', async function() {
    // If password isn't modified, just exit the function
    if (!this.isModified('password')) return;

    try {
        this.password = await bcrypt.hash(this.password, 10);
    } catch (err) {
        throw err; // Mongoose will catch this as a validation error
    }
});

module.exports = mongoose.model('Admin', AdminSchema);