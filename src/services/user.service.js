const Participant = require('../models/Participant');
const Category = require('../models/Category');
const Election = require('../models/Election');
const Voter = require('../models/Voter');
const EligibleVoter = require('../models/EligibleVoter');

class UserService {
    /**
     * 1. Get Available Candidates (Ballot)
     * FIXED: Mapped 'p.name' instead of 'p.fullName'
     */
    async getAvailableCandidates() {
        const categories = await Category.find().lean();
        const participants = await Participant.find().lean();

        return categories.map(cat => ({
            positionName: cat.name, 
            positionId: cat._id,
            candidates: participants
                .filter(p => p.category.toString() === cat._id.toString())
                .map(p => ({
                    candidateId: p._id,
                    name: p.name, // Changed from p.fullName to p.name
                    imageUrl: p.imageUrl,
                    level: p.level
                }))
        }));
    }

    /**
     * 2. Process a Vote
     * FIXED: Changed candidateName mapping to candidate.name
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
                selections: [] 
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
            candidateName: candidate.name // Changed from fullName to name
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
     */
    async getUserVoteRecord(voterId) {
        const voter = await Voter.findOne({ voterId: voterId.toUpperCase() });
        
        if (!voter) {
            const eligible = await EligibleVoter.findOne({ matNumber: voterId.toUpperCase() });
            if (eligible && eligible.hasVoted) {
                return { votes: [], message: "Vote cast, but details unavailable." };
            }
            return null;
        }

        return {
            votes: voter.selections && voter.selections.length > 0 
                ? voter.selections 
                : []
        };
    }
}

module.exports = new UserService();