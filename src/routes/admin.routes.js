const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const upload = require('../middlewares/upload');
const verifyAdmin = require('../middlewares/auth');

// --- Auth Routes (Public) ---
router.post('/register', adminController.register);
router.post('/login', adminController.login);

// --- Protected Routes (Require Token) ---
router.use(verifyAdmin); // Everything below this uses verifyAdmin automatically

// FIXED: Removed the undefined 'authMiddleware' variable
router.get('/totalvoters', adminController.getTotalVotersCount);

router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.post('/participants', upload.single('profileImage'), adminController.addParticipant);
router.post('/setup', adminController.setupElection);
router.get('/totalparticipants', adminController.getTotalParticipants);
router.get('/totalvotes', adminController.getTotalVotes);
router.get('/dashboard', adminController.getResults);

module.exports = router;