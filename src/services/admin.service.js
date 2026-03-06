const Participant = require('../models/Participant');
const Category = require('../models/Category');
const Election = require('../models/Election');

class AdminService {
    /**
     * 1. Initialize Election
     * Sets the title and calculates the expiration time.
     */
    async initializeElection(title, durationHours) {
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + parseInt(durationHours));

        // We only want one election config at a time
        await Election.deleteMany({}); 
        
        return await Election.create({
            title,
            endTime,
            isOpen: true
        });
    }

    /**
     * 2. Add Category
     * Admin creates positions like 'President', 'Sec Gen'
     */
    async addCategory(name, key) {
        const normalizedKey = key.toLowerCase();
        const existing = await Category.findOne({ key: normalizedKey });
        if (existing) throw new Error("Category key already exists");

        return await Category.create({ name, key: normalizedKey });
    }

    /**
     * 3. Register Participant
     * Logic to link a candidate to a valid category
     */
    async registerParticipant(name, categoryKey) {
        const category = await Category.findOne({ key: categoryKey.toLowerCase() });
        if (!category) throw new Error("Category not found");

        return await Participant.create({
            name,
            category: category._id,
            voteCount: 0
        });
    }

    /**
     * 4. Fetch Total Participants
     * Used for the admin dashboard count
     */
    async fetchTotalParticipants() {
        return await Participant.countDocuments();
    }

    /**
     * 5. Fetch Total Votes
     * Uses MongoDB Aggregation to sum up all votes in the system
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
     * Groups participants by category and sorts them by who is winning
     */
    async getLiveLeaderboard() {
        // Find all participants, attach category details, sort by votes
        const participants = await Participant.find()
            .populate('category')
            .sort({ voteCount: -1 });

        // Logic to check if election is still active
        const election = await Election.findOne();
        const now = new Date();
        const isExpired = election && now > election.endTime;

        return {
            electionStatus: isExpired ? "Closed" : "Active",
            results: participants
        };
    }
}

module.exports = new AdminService();