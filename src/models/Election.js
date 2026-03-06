const mongoose = require('mongoose');

const ElectionSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    endTime: { 
        type: Date, 
        required: true 
    },
    isOpen: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Election', ElectionSchema);