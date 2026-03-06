const adminService = require('../services/admin.service');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AdminController {
    // Auth: Register a new Admin
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

    // Auth: Login Admin
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

    async addParticipant(req, res) {
        try {
            const { name, categoryKey, level, manifesto } = req.body;
            const imagePath = req.file ? req.file.path : null;

            if (!name || !categoryKey || !level) throw new Error("Missing required fields");

            const participant = await adminService.registerParticipant(name, categoryKey, level, manifesto, imagePath);
            res.status(201).json({ status: "success", data: participant });
        } catch (error) {
            res.status(400).json({ status: "error", message: error.message });
        }
    }

    async setupElection(req, res) {
        try {
            const { title, durationHours } = req.body;
            const election = await adminService.initializeElection(title, durationHours);
            res.status(200).json({ status: "success", data: election });
        } catch (error) { res.status(400).json({ status: "error", message: error.message }); }
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

    async createCategory(req, res) {
        try {
            const { name, key } = req.body; 
            const category = await adminService.addCategory(name, key);
            res.status(201).json({ status: "success", data: category });
        } catch (error) { res.status(400).json({ status: "error", message: error.message }); }
    }
}

module.exports = new AdminController();