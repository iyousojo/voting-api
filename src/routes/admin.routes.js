const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// --- Category Management ---
// Endpoint: POST /api/admin/categories
router.post('/categories', adminController.createCategory);

// --- Participant Management ---
// Endpoint: POST /api/admin/participants
router.post('/participants', adminController.addParticipant);

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