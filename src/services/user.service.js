const Participant = require('../models/Participant');
const Category = require('../models/Category');
const Election = require('../models/Election');
const Voter = require('../models/Voter');
const EligibleVoter = require('../models/EligibleVoter'); // For tracking voters and preventing double voting

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
 * logic: Validates Whitelist (Mat Number), Checks Device Limits, and Prevents Double Voting
 */
async processVote(participantId, matNumber, deviceHash) {
    // 1. Election status check
    const election = await Election.findOne();
    if (!election || !election.isOpen || new Date() > election.endTime) {
        throw new Error("Election is closed or expired.");
    }

    // 2. WHITELIST CHECK: Is this a valid student?
    // We use matNumber here because it's the unique identifier for the student
    const eligibleStudent = await EligibleVoter.findOne({ 
        matNumber: matNumber.toUpperCase() 
    });

    if (!eligibleStudent) {
        throw new Error("Unauthorized: You are not registered in the voter whitelist.");
    }

    // 3. Security Check: Prevent "Bulk Voting" from one device
    const deviceUsageCount = await Voter.countDocuments({ deviceHash });
    if (deviceUsageCount >= 3) {
        throw new Error("Security alert: Device voting limit reached.");
    }

    // 4. Find the candidate to identify the category
    const candidate = await Participant.findById(participantId);
    if (!candidate) throw new Error("Candidate not found.");

    // 5. Check/Create Voter record (the actual voting history)
    let voter = await Voter.findOne({ voterId: matNumber });

    if (!voter) {
        voter = new Voter({ 
            voterId: matNumber, 
            deviceHash, 
            votedCategories: [] 
        });
    }

    // 6. Category Check: Prevent double voting in the same position
    if (voter.votedCategories.includes(candidate.category)) {
        throw new Error("You have already cast a vote in this category.");
    }

    // 7. Persistence: Atomic updates
    candidate.voteCount += 1;
    await candidate.save();

    voter.votedCategories.push(candidate.category);
    await voter.save();

    // 8. Update Whitelist status
    eligibleStudent.hasVoted = true;
    await eligibleStudent.save();

    return { 
        message: "Vote cast successfully", 
        receipt: { voter: matNumber, category: candidate.category } 
    };
}

// Inside user.service.js
async getUserVoteRecord(voterId) {
    // 1. Find the voter
    const voter = await EligibleVoter.findOne({ matNumber: voterId });
    if (!voter || !voter.hasVoted) return null;

    // 2. Fetch the actual votes from your Votes collection
    // Replace 'VoteModel' with your actual Vote model name
    const votes = await VoteModel.find({ voterId: voterId }).populate('candidateId');

    // 3. Format it for the frontend
    return {
        votes: votes.map(v => ({
            positionName: v.positionName, // or v.candidateId.position
            candidateName: v.candidateId.fullName
        }))
    };
}
}

module.exports = new UserService();