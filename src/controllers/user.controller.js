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
        const { fullName, matNumber, studentId, phoneNumber, email } = req.body;

        // 1. Basic Validation
        if (!fullName || !matNumber || !studentId || !phoneNumber || !email) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 2. Check if already registered
        const existingVoter = await EligibleVoter.findOne({ 
            $or: [{ matNumber: matNumber.toUpperCase() }, { email: email.toLowerCase() }] 
        });

        if (existingVoter) {
            return res.status(400).json({ message: "Student with this Matric Number or Email already exists" });
        }

        // 3. Create New Voter
        const newVoter = new EligibleVoter({
            fullName,
            matNumber,
            studentId,
            phoneNumber,
            email
        });

        await newVoter.save();

        res.status(201).json({ 
            status: "success", 
            message: "Registration successful! You can now log in to vote.",
            data: { matNumber: newVoter.matNumber }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
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

            if (!participantId || !voterId || !deviceHash) {
                return res.status(400).json({ status: "error", message: "Missing credentials" });
            }

            // voterId here should be the matNumber passed from the login
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
}

module.exports = new UserController();