const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// GET the "ballot" - list of all categories and candidates
// URL: GET http://localhost:3000/api/user/ballot
router.get('/ballot', userController.getBallot);

// POST a vote for a candidate
// URL: POST http://localhost:3000/api/user/vote
router.post('/login', userController.login);

// URL: POST http://localhost:3000/api/user/register
router.post('/register', userController.register);
// Add this line to your existing routes
router.get('/my-vote/:voterId', userController.getMyVote);

module.exports = router;