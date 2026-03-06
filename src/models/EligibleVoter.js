const mongoose = require('mongoose');

const EligibleVoterSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    matNumber: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true, 
        trim: true 
    },
    studentId: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    phoneNumber: { 
        type: String, 
        required: true, 
        unique: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    hasVoted: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

module.exports = mongoose.model('EligibleVoter', EligibleVoterSchema);