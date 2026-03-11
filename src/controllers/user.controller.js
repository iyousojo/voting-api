const userService = require('../services/user.service');
const { logVoteActivity } = require('../middlewares/audit.middleware');
const EligibleVoter = require('../models/EligibleVoter'); 
const jwt = require('jsonwebtoken'); // <--- ADD THIS: Missing import
const Election = require('../models/Election'); // Added missing import

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

            // FIX: Changed 'User' to 'EligibleVoter'
            const existingUser = await EligibleVoter.findOne({ 
                $or: [{ matNumber }, { studentId }, { email }] 
            });
            
            if (existingUser) {
                return res.status(400).json({ 
                    status: "error", 
                    message: "User with this Matric Number, ID, or Email already exists." 
                });
            }

            // FIX: Changed 'User' to 'EligibleVoter'
            const newUser = new EligibleVoter({
                fullName,
                matNumber,
                studentId,
                phoneNumber,
                email
            });

            await newUser.save();

            // This will now work because 'jwt' is imported above
            const token = jwt.sign(
                { id: newUser._id, role: 'voter' }, 
                process.env.JWT_SECRET, 
                { expiresIn: '2h' }
            );

            res.status(201).json({ 
                status: "success", 
                message: "Registration successful",
                token 
            });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
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