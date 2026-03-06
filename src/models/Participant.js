const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Participant name is required"], 
        trim: true 
    },
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category', 
        required: true 
    },
    // Added Level field
    level: {
        type: String,
        required: [true, "Level is required"],
        enum: {
            values: ['100L', '200L', '300L', '400L', '500L', 'Spillover'],
            message: '{VALUE} is not a valid level'
        }
    },
    // Optional: Add a bio or manifesto snippet
    manifesto: {
        type: String,
        trim: true,
        maxlength: [500, "Manifesto cannot exceed 500 characters"]
    },
    voteCount: { 
        type: Number, 
        default: 0 
    }
}, { timestamps: true });

module.exports = mongoose.model('Participant', ParticipantSchema);