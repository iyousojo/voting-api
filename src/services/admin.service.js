const Participant = require('../models/Participant');
const Category = require('../models/Category');
const Election = require('../models/Election');

class AdminService {
    /**
     * 1. Initialize Election
     */
    async initializeElection(title, durationHours) {
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + parseInt(durationHours));

        await Election.deleteMany({}); 
        
        return await Election.create({
            title,
            endTime,
            isOpen: true
        });
    }

    /**
     * 2. Add Category
     */
    async addCategory(name, key) {
        const normalizedKey = key.toLowerCase();
        const existing = await Category.findOne({ key: normalizedKey });
        if (existing) throw new Error("Category key already exists");

        return await Category.create({ name, key: normalizedKey });
    }

    /**
     * 3. Register Participant (Updated with LEVEL)
     */
    async registerParticipant(name, categoryKey, level) {
        // Validation checks
        if (!categoryKey) throw new Error("categoryKey is required");
        if (!name) throw new Error("Participant name is required");
        if (!level) throw new Error("Participant level is required");

        const category = await Category.findOne({ key: categoryKey.toLowerCase() });
        if (!category) throw new Error(`Category with key '${categoryKey}' not found`);

        // Create the participant with the level field
        return await Participant.create({
            name,
            level, // New field saved here
            category: category._id,
            voteCount: 0
        });
    }

    /**
     * 4. Fetch Total Participants
     */
    async fetchTotalParticipants() {
        return await Participant.countDocuments();
    }

    /**
     * 5. Fetch Total Votes
     */
    async fetchTotalVotes() {
        const result = await Participant.aggregate([
            {
                $group: {
                    _id: null,
                    totalVotes: { $sum: "$voteCount" }
                }
            }
        ]);
        return result.length > 0 ? result[0].totalVotes : 0;
    }

    /**
     * 6. Get Live Results
     */
    async getLiveLeaderboard() {
        // Finding participants and populating category
        const participants = await Participant.find()
            .populate('category')
            .sort({ voteCount: -1 });

        const election = await Election.findOne();
        const now = new Date();
        const isExpired = election && now > election.endTime;

        return {
            electionStatus: isExpired ? "Closed" : "Active",
            results: participants.map(p => ({
                name: p.name,
                level: p.level, // Level included in results
                category: p.category ? p.category.name : "Uncategorized",
                votes: p.voteCount
            }))
        };
    }
}

module.exports = new AdminService();