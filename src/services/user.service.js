const Participant = require('../models/Participant');
const Category = require('../models/Category');
const Election = require('../models/Election');
const Voter = require('../models/Voter'); // For tracking voters and preventing double voting

class UserService {
    /**
     * 1. Get Available Candidates (Ballot)
     * Returns candidates grouped by their categories
     */
    async getAvailableCandidates() {
        // Fetch all categories
        const categories = await Category.find().lean();
        
        // Fetch all participants and group them by category in memory
        const participants = await Participant.find().lean();

        return categories.map(cat => ({
            categoryName: cat.name,
            categoryKey: cat.key,
            candidates: participants.filter(p => p.category.toString() === cat._id.toString())
        }));
    }

  /**
     * 2. Process a Vote
     * Validates election status, student ID uniqueness, and device fingerprint limits.
     */
   /**
     * 2. Process a Vote
     * Enhanced with Student ID check AND Device Fingerprint security
     */
    async processVote(participantId, voterId, deviceHash) {
        // 1. Election status check
        const election = await Election.findOne();
        if (!election || !election.isOpen || new Date() > election.endTime) {
            throw new Error("Election is closed or expired.");
        }

        // 2. Security Check: Prevent "Bulk Voting" from one device
        // Example: Allow maximum 3 different students per device (for shared labs/library)
        const deviceUsageCount = await Voter.countDocuments({ deviceHash });
        if (deviceUsageCount >= 3) {
            throw new Error("Security alert: This device has reached the maximum allowed voting limit.");
        }

        // 3. Find the candidate to identify the category
        const candidate = await Participant.findById(participantId);
        if (!candidate) throw new Error("Candidate not found.");

        // 4. Check/Create Voter record and prevent double voting
        let voter = await Voter.findOne({ voterId });

        if (!voter) {
            // New voter: Save their ID and their device fingerprint
            voter = new Voter({ 
                voterId, 
                deviceHash, 
                votedCategories: [] 
            });
        }

        // 5. Category Check: Prevent double voting in the same position
        if (voter.votedCategories.includes(candidate.category)) {
            throw new Error("You have already cast a vote in this category.");
        }

        // 6. Persistence: Increment candidate and update voter history
        // Using save() here is fine for simple logic, but for high traffic 
        // you'd use findByIdAndUpdate with $inc for the candidate.
        candidate.voteCount += 1;
        await candidate.save();

        voter.votedCategories.push(candidate.category);
        await voter.save();

        return { 
            message: "Vote cast successfully", 
            receipt: { voter: voterId, category: candidate.category } 
        };
    }
}

module.exports = new UserService();