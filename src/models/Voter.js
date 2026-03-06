const mongoose = require('mongoose');

const VoterSchema = new mongoose.Schema({
    // This stores the Student ID (Matric Number)
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
    // Array of category IDs the user has already participated in
    votedCategories: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Category' 
        }
    ],
    // NEW: Stores the specific choices for the "Voted" summary
    selections: [
        {
            positionName: { type: String, required: true },
            candidateName: { type: String, required: true }
        }
    ]
}, { timestamps: true });

// Index for security checks
VoterSchema.index({ deviceHash: 1 });

module.exports = mongoose.model('Voter', VoterSchema);