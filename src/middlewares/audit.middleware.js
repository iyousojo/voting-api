const AuditLog = require('../models/AuditLog');

const logVoteActivity = async (req, status, reason = null) => {
    try {
        await AuditLog.create({
            voterId: req.body.voterId || 'UNKNOWN',
            deviceHash: req.body.deviceHash || 'UNKNOWN',
            ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            status: status,
            reason: reason
        });
    } catch (err) {
        console.error("Audit Logging Failed:", err);
    }
};

module.exports = { logVoteActivity };