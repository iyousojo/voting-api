const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const upload = require('../middlewares/upload'); // 👈 Import your Multer middleware

// --- Category Management ---
// Endpoint: POST /api/admin/categories
router.post('/categories', adminController.createCategory);

// --- Participant Management ---
// Endpoint: POST /api/admin/participants
// 🚀 Added 'upload.single' to handle the image before it reaches the controller
router.post('/participants', upload.single('profileImage'), adminController.addParticipant);

// --- Election Management ---
// Endpoint: POST /api/admin/setup
router.post('/setup', adminController.setupElection);

// --- Dashboard & Stats ---
// Endpoint: GET /api/admin/totalparticipants
router.get('/totalparticipants', adminController.getTotalParticipants);

// Endpoint: GET /api/admin/totalvotes
router.get('/totalvotes', adminController.getTotalVotes);

// Endpoint: GET /api/admin/dashboard
router.get('/dashboard', adminController.getResults);

module.exports = router;