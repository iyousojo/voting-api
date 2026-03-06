const userService = require('../services/user.service');
const { logVoteActivity } = require('../middlewares/audit.middleware');

class UserController {
    /**
     * 1. GET all categories and their candidates
     * Used to show the ballot paper to the voter
     */
    async getBallot(req, res) {
        try {
            const ballot = await userService.getAvailableCandidates();
            res.status(200).json({ 
                status: "success", 
                data: ballot 
            });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    }

/**
     * 2. POST cast a vote
     * Logic: Securely increase vote count using Voter ID and Device Fingerprint
     */
   async castVote(req, res) {
    try {
        const { participantId, voterId, deviceHash } = req.body;

        if (!participantId || !voterId || !deviceHash) {
            return res.status(400).json({ status: "error", message: "Missing credentials" });
        }

        const result = await userService.processVote(participantId, voterId, deviceHash);
        
        // Log Success
        await logVoteActivity(req, 'SUCCESS');

        res.status(200).json({ status: "success", data: result });
    } catch (error) {
        // Log Failure with the error message
        await logVoteActivity(req, 'FAILED', error.message);

        const statusCode = error.message.includes("closed") ? 403 : 400;
        res.status(statusCode).json({ status: "error", message: error.message });
    }
    }
}

module.exports = new UserController();