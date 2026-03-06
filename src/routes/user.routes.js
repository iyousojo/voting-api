const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// GET the "ballot" - list of all categories and candidates
// URL: GET http://localhost:3000/api/user/ballot
router.get('/ballot', userController.getBallot);

// POST a vote for a candidate
// URL: POST http://localhost:3000/api/user/vote
router.post('/vote', userController.castVote);

module.exports = router;