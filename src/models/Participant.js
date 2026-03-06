const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Participant name is required"], 
        trim: true 
    },
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category', // Links to the Category model
        required: true 
    },
    voteCount: { 
        type: Number, 
        default: 0 
    }
}, { timestamps: true });

module.exports = mongoose.model('Participant', ParticipantSchema);