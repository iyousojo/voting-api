const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    voterId: String,
    deviceHash: String,
    action: { type: String, default: 'VOTE_ATTEMPT' },
    status: { type: String, enum: ['SUCCESS', 'FAILED'] },
    reason: String, // e.g., "Double voting" or "Election closed"
    ipAddress: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);