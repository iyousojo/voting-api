const adminService = require('../services/admin.service');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Category = require('../models/Category'); 
const Election = require('../models/Election'); // Import the Election model

class AdminController {

    /**
     * Helper: Returns true if there is an election that is 'isOpen' 
     * and has not yet reached its 'endTime'.
     */
    async _isElectionActive() {
        const activeElection = await Election.findOne({ isOpen: true });
        if (activeElection) {
            const now = new Date();
            // If current time is before end time, it is active
            if (now < activeElection.endTime) {
                return true;
            }
        }
        return false;
    }

    async addParticipant(req, res) {
        try {
            // Check if election is active
            if (await this._isElectionActive()) {
                return res.status(403).json({ 
                    status: "error", 
                    message: "Cannot add candidates while an election is currently active." 
                });
            }

            const { name, categoryKey, level, manifesto } = req.body;
            const imagePath = req.file ? req.file.path : null;

            if (!name || !categoryKey || !level) throw new Error("Missing required fields");

            const participant = await adminService.registerParticipant(name, categoryKey, level, manifesto, imagePath);
            res.status(201).json({ status: "success", data: participant });
        } catch (error) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async createCategory(req, res) {
        try {
            // Check if election is active
            if (await this._isElectionActive()) {
                return res.status(403).json({ 
                    status: "error", 
                    message: "Modification of categories is disabled during an active election." 
                });
            }

            const { name, key } = req.body; 
            const category = await adminService.addCategory(name, key);
            res.status(201).json({ status: "success", data: category });
        } catch (error) { 
            res.status(400).json({ status: "error", message: error.message }); 
        }
    }

    async setupElection(req, res) {
        try {
            // Check if an election is ALREADY active to prevent double-starting
            if (await this._isElectionActive()) {
                return res.status(400).json({ 
                    status: "error", 
                    message: "An election is already running. Please wait for it to end." 
                });
            }

            const { title, durationHours } = req.body;
            const election = await adminService.initializeElection(title, durationHours);
            res.status(200).json({ status: "success", data: election });
        } catch (error) { 
            res.status(400).json({ status: "error", message: error.message }); 
        }
    }

    // --- Auth & Stats (Always Accessible) ---

    async register(req, res) {
        try {
            const { username, password, adminSecret } = req.body;
            if (adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
                return res.status(403).json({ status: "error", message: "Invalid Secret Key" });
            }
            const admin = new Admin({ username, password });
            await admin.save();
            res.status(201).json({ status: "success", message: "Admin created" });
        } catch (error) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;
            const admin = await Admin.findOne({ username });
            if (!admin || !(await bcrypt.compare(password, admin.password))) {
                return res.status(401).json({ status: "error", message: "Invalid credentials" });
            }
            const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.status(200).json({ status: "success", token });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    }

    async getTotalParticipants(req, res) {
        const total = await adminService.fetchTotalParticipants();
        res.status(200).json({ status: "success", count: total });
    }

    async getTotalVotes(req, res) {
        const total = await adminService.fetchTotalVotes();
        res.status(200).json({ status: "success", total_votes: total });
    }

    async getResults(req, res) {
        const results = await adminService.getLiveLeaderboard();
        res.status(200).json({ status: "success", results });
    }

    async getCategories(req, res) {
        try {
            const categories = await Category.find();
            res.status(200).json({ status: "success", data: categories });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    }

    async getTotalVotersCount(req, res) {
        try {
            const count = await adminService.getTotalVoters();
            res.status(200).json({ status: "success", count: count });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    }
// Add this to your AdminController class

async stopElection(req, res) {
    try {
        // Find the active election and close it
        const activeElection = await Election.findOneAndUpdate(
            { isOpen: true },
            { isOpen: false, endTime: new Date() }, // Set end time to now
            { new: true }
        );

        if (!activeElection) {
            return res.status(404).json({ status: "error", message: "No active election found." });
        }

        res.status(200).json({ status: "success", message: "Election stopped successfully." });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

// UPDATE your existing getResults method to include the title
async getResults(req, res) {
    try {
        const currentElection = await Election.findOne().sort({ createdAt: -1 });
        
        // If no election exists at all, status MUST be "Closed"
        if (!currentElection) {
            return res.status(200).json({ 
                status: "success", 
                results: {
                    electionTitle: null,
                    electionStatus: "Closed",
                    leaderboard: []
                }
            });
        }

        const now = new Date();
        const isActive = currentElection.isOpen && now < currentElection.endTime;

        res.status(200).json({ 
            status: "success", 
            results: {
                electionTitle: currentElection.title,
                electionStatus: isActive ? "Active" : "Closed",
                leaderboard: await adminService.getLiveLeaderboard() 
            }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

}

module.exports = new AdminController(); 