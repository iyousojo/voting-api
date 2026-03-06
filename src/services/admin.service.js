const cloudinary = require('cloudinary').v2;
const Participant = require('../models/Participant');
const Category = require('../models/Category');
const Election = require('../models/Election');

// Configure Cloudinary (Keep these in your .env file)
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

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
     * 3. Register Participant (Updated with Level, Manifesto, and Cloudinary Image)
     */
    async registerParticipant(name, categoryKey, level, manifesto, imageFile) {
        // Validation checks
        if (!categoryKey) throw new Error("categoryKey is required");
        if (!name) throw new Error("Participant name is required");
        if (!level) throw new Error("Participant level is required");

        const category = await Category.findOne({ key: categoryKey.toLowerCase() });
        if (!category) throw new Error(`Category with key '${categoryKey}' not found`);

        let imageUrl = "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"; 

        // Upload to Cloudinary if an image file exists
        if (imageFile) {
            try {
                const uploadRes = await cloudinary.uploader.upload(imageFile, {
                    folder: "nacos_elections",
                    transformation: [
                        { width: 500, height: 500, crop: "fill", gravity: "face" }
                    ]
                });
                imageUrl = uploadRes.secure_url;
            } catch (error) {
                console.error("Cloudinary Error:", error);
                throw new Error("Image upload failed");
            }
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