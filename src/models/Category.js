const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Category name is required"], 
        trim: true 
    },
    key: { 
        type: String, 
        required: [true, "Category key is required"], 
        unique: true, 
        lowercase: true, 
        trim: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);