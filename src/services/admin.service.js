const cloudinary = require('cloudinary').v2;
const Participant = require('../models/Participant');
const Category = require('../models/Category');
const Election = require('../models/Election');
const EligibleVoter = require('../models/EligibleVoter'); // Your voter model

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

class AdminService {
    async initializeElection(title, durationHours) {
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + parseInt(durationHours));
        await Election.deleteMany({}); 
        return await Election.create({ title, endTime, isOpen: true });
    }

    async addCategory(name, key) {
        const normalizedKey = key.toLowerCase();
        const existing = await Category.findOne({ key: normalizedKey });
        if (existing) throw new Error("Category key already exists");
        return await Category.create({ name, key: normalizedKey });
    }

    async registerParticipant(name, categoryKey, level, manifesto, imageFile) {
        const category = await Category.findOne({ key: categoryKey.toLowerCase() });
        if (!category) throw new Error(`Category with key '${categoryKey}' not found`);

        let imageUrl = "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"; 

        if (imageFile) {
            const uploadRes = await cloudinary.uploader.upload(imageFile, {
                folder: "nacos_elections",
                transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }]
            });
            imageUrl = uploadRes.secure_url;
        }

        return await Participant.create({
            name,
            level,
            manifesto,
            category: category._id,
            profileImage: imageUrl,
            voteCount: 0
        });
    }

    async fetchTotalParticipants() { 
        return await Participant.countDocuments(); 
    }

    async fetchTotalVotes() {
        const result = await Participant.aggregate([{ $group: { _id: null, totalVotes: { $sum: "$voteCount" } } }]);
        return result.length > 0 ? result[0].totalVotes : 0;
    }

    // UPDATED: Using the correct EligibleVoter model imported above
    async getTotalVoters() {
        try {
            // This counts all records in your EligibleVoter collection
            return await EligibleVoter.countDocuments(); 
        } catch (error) {
            throw new Error("Error fetching total voters: " + error.message);
        }
    }

    async getLiveLeaderboard() {
        const participants = await Participant.find().populate('category').sort({ voteCount: -1 });
        const election = await Election.findOne();
        const isExpired = election && new Date() > election.endTime;

        return {
            electionStatus: isExpired ? "Closed" : "Active",
            results: participants.map(p => ({
                name: p.name,
                level: p.level,
                manifesto: p.manifesto,
                profileImage: p.profileImage,
                category: p.category ? p.category.name : "Uncategorized",
                votes: p.voteCount
            }))
        };
    }
}

module.exports = new AdminService();