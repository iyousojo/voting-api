const adminService = require('../services/admin.service');

class AdminController {
    // 1. Setup the Election (Set Duration)
    async setupElection(req, res) {
        try {
            const { title, durationHours } = req.body;
            const election = await adminService.initializeElection(title, durationHours);
            res.status(200).json({ status: "success", data: election });
        } catch (error) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    // 2. Add a Participant to a Category (Updated with LEVEL)
    async addParticipant(req, res) {
        try {
            // Destructured 'level' from the request body
            const { name, categoryKey, level } = req.body;

            // 🛡️ Updated Defensive Check
            if (!name || !categoryKey || !level) {
                return res.status(400).json({ 
                    status: "error", 
                    message: "Missing required fields: 'name', 'categoryKey', and 'level' are all mandatory." 
                });
            }

            // Optional: Extra validation to match your Schema Enum
            const validLevels = ['100L', '200L', '300L', '400L', '500L', 'Spillover'];
            if (!validLevels.includes(level)) {
                return res.status(400).json({
                    status: "error",
                    message: `Invalid level. Must be one of: ${validLevels.join(', ')}`
                });
            }

            // Pass 'level' to the service
            const participant = await adminService.registerParticipant(name, categoryKey, level);
            
            res.status(201).json({ status: "success", data: participant });
        } catch (error) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    // 3. GET Total Participants 
    async getTotalParticipants(req, res) {
        try {
            const total = await adminService.fetchTotalParticipants();
            res.status(200).json({ status: "success", count: total });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    }

    // 4. GET Total Votes 
    async getTotalVotes(req, res) {
        try {
            const total = await adminService.fetchTotalVotes();
            res.status(200).json({ status: "success", total_votes: total });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    }

    // 5. GET Leaderboard/Winners
    async getResults(req, res) {
        try {
            const results = await adminService.getLiveLeaderboard();
            res.status(200).json({ status: "success", results });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    }

    async createCategory(req, res) {
        try {
            const { name, key } = req.body; 
            const category = await adminService.addCategory(name, key);
            
            res.status(201).json({ 
                status: "success", 
                message: "Category created successfully",
                data: category 
            });
        } catch (error) {
            res.status(400).json({ 
                status: "error", 
                message: error.message 
            });
        }
    }
}

module.exports = new AdminController();