const mongoose = require('mongoose');

const VoterSchema = new mongoose.Schema({
    // This stores the Student ID or Email
    voterId: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    // This stores the unique browser/device fingerprint
    deviceHash: {
        type: String,
        required: true,
        trim: true
    },
    votedCategories: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Category' 
        }
    ]
}, { timestamps: true });

// Optional: Add an index to deviceHash to make searching for cheaters faster
VoterSchema.index({ deviceHash: 1 });

module.exports = mongoose.model('Voter', VoterSchema);