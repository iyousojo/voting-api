const userService = require('../services/user.service');
const { logVoteActivity } = require('../middlewares/audit.middleware');
const EligibleVoter = require('../models/EligibleVoter'); // Added missing import

class UserController {
    /**
     * 0. POST login
     * Validates student credentials against the whitelist
     */
    async login(req, res) {
        try {
            const { matNumber, studentId } = req.body;

            if (!matNumber || !studentId) {
                return res.status(400).json({ message: "Matric Number and Student ID are required" });
            }

            // Check if student is on the whitelist
            const student = await EligibleVoter.findOne({ 
                matNumber: matNumber.toUpperCase(), 
                studentId: studentId 
            });

            if (!student) {
                return res.status(401).json({ message: "Invalid credentials or not registered to vote." });
            }

            res.status(200).json({ 
                status: "success", 
                message: "Login successful", 
                data: { 
                    matNumber: student.matNumber, 
                    hasVoted: student.hasVoted 
                } 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

async register(req, res) {
    try {
        const { username, password, adminSecret } = req.body;
        
        if (adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
            return res.status(403).json({ status: "error", message: "Invalid Secret Key" });
        }

        const admin = new Admin({ username, password });
        await admin.save();

        res.status(201).json({ status: "success", message: "Admin registered successfully!" });
    } catch (error) {
        // Handle Duplicate Key Error (MongoDB code 11000)
        if (error.code === 11000) {
            return res.status(400).json({ 
                status: "error", 
                message: "Username already exists. Please choose another one." 
            });
        }
        
        res.status(400).json({ status: "error", message: error.message });
    }
}

    /**
     * 1. GET all categories and their candidates
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
     */
    async castVote(req, res) {
    try {
        const { participantId, voterId, deviceHash } = req.body;

        // 1. Validate input
        if (!participantId || !voterId || !deviceHash) {
            return res.status(400).json({ status: "error", message: "Missing credentials" });
        }

        // 2. Add an Election Status check here if not handled in service
        const election = await Election.findOne();
        if (!election || !election.isOpen || new Date() > election.endTime) {
            return res.status(403).json({ status: "error", message: "Election is closed" });
        }

        const result = await userService.processVote(participantId, voterId, deviceHash);
        await logVoteActivity(req, 'SUCCESS');
        res.status(200).json({ status: "success", data: result });

    } catch (error) {
            await logVoteActivity(req, 'FAILED', error.message);

            // Refined Status Codes
            let statusCode = 400;
            if (error.message.includes("closed") || error.message.includes("expired")) statusCode = 403;
            if (error.message.includes("Unauthorized")) statusCode = 401;
            if (error.message.includes("already cast")) statusCode = 409;

            res.status(statusCode).json({ status: "error", message: error.message });
        }
        

        
    }

    /**
     * 3. GET user's cast votes
     * Fetches what the user actually voted for
     */
    async getMyVote(req, res) {
        try {
            const { voterId } = req.params; // This is the matNumber

            if (!voterId) {
                return res.status(400).json({ status: "error", message: "Voter ID is required" });
            }

            // We call a service to fetch the specific choices from the database
            const voteDetails = await userService.getUserVoteRecord(voterId);

            if (!voteDetails) {
                return res.status(404).json({ status: "error", message: "No vote record found for this user." });
            }

            res.status(200).json({ 
                status: "success", 
                data: voteDetails // Should contain an array of { positionName, candidateName }
            });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    }
    
}

module.exports = new UserController();