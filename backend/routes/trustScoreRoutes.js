const express = require('express');
const router = express.Router();
const { getTrustScoreHistory } = require('../controllers/trustScoreController');
const { protect } = require('../middleware/authMiddleware');

router.get('/history', protect, getTrustScoreHistory);

module.exports = router;
