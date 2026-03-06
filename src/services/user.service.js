const Participant = require('../models/Participant');
const Category = require('../models/Category');
const Election = require('../models/Election');
const Voter = require('../models/Voter');
const EligibleVoter = require('../models/EligibleVoter');

class UserService {
    /**
     * 1. Get Available Candidates (Ballot)
     */
    async getAvailableCandidates() {
        const categories = await Category.find().lean();
        const participants = await Participant.find().lean();

        return categories.map(cat => ({
            positionName: cat.name, // Matches frontend expectations
            positionId: cat._id,
            candidates: participants
                .filter(p => p.category.toString() === cat._id.toString())
                .map(p => ({
                    candidateId: p._id,
                    fullName: p.fullName,
                    imageUrl: p.imageUrl,
                    level: p.level
                }))
        }));
    }

    /**
     * 2. Process a Vote
     * Updated to store candidate details inside the Voter record
     */
    async processVote(participantId, matNumber, deviceHash) {
        const election = await Election.findOne();
        if (!election || !election.isOpen || new Date() > election.endTime) {
            throw new Error("Election is closed or expired.");
        }

        const eligibleStudent = await EligibleVoter.findOne({ 
            matNumber: matNumber.toUpperCase() 
        });

        if (!eligibleStudent) {
            throw new Error("Unauthorized: You are not registered in the voter whitelist.");
        }

        const deviceUsageCount = await Voter.countDocuments({ deviceHash });
        if (deviceUsageCount >= 3) {
            throw new Error("Security alert: Device voting limit reached.");
        }

        const candidate = await Participant.findById(participantId).populate('category');
        if (!candidate) throw new Error("Candidate not found.");

        let voter = await Voter.findOne({ voterId: matNumber.toUpperCase() });

        if (!voter) {
            voter = new Voter({ 
                voterId: matNumber.toUpperCase(), 
                deviceHash, 
                votedCategories: [],
                selections: [] // Ensure your Voter Schema has this array
            });
        }

        if (voter.votedCategories.includes(candidate.category._id)) {
            throw new Error("You have already cast a vote in this category.");
        }

        // Atomic update to candidate count
        candidate.voteCount += 1;
        await candidate.save();

        // Save the category ID and the Selection details for receipt
        voter.votedCategories.push(candidate.category._id);
        voter.selections.push({
            positionName: candidate.category.name,
            candidateName: candidate.fullName
        });
        
        await voter.save();

        eligibleStudent.hasVoted = true;
        await eligibleStudent.save();

        return { 
            message: "Vote cast successfully", 
            receipt: { voter: matNumber, category: candidate.category.name } 
        };
    }

    /**
     * 3. Get User Vote Record
     * Retrieves the specific candidates this user voted for
     */
    async getUserVoteRecord(voterId) {
        // 1. Find the voter record in the main Voter collection
        const voter = await Voter.findOne({ voterId: voterId.toUpperCase() });
        
        if (!voter) {
            // Fallback: Check whitelist if they voted but record is missing
            const eligible = await EligibleVoter.findOne({ matNumber: voterId.toUpperCase() });
            if (eligible && eligible.hasVoted) {
                return { votes: [], message: "Vote cast, but details unavailable." };
            }
            return null;
        }

        // 2. Return the selections we stored during processVote
        return {
            votes: voter.selections && voter.selections.length > 0 
                ? voter.selections 
                : []
        };
    }
}

module.exports = new UserService();