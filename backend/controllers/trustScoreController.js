const asyncHandler = require('express-async-handler');
const TrustScoreHistory = require('../models/TrustScoreHistory');

// @desc    Get Trust Score History
// @route   GET /api/trust/history
// @access  Private
const getTrustScoreHistory = asyncHandler(async (req, res) => {
    const history = await TrustScoreHistory.find({ user: req.user._id })
        .sort({ createdAt: 1 })
        .select('score reason createdAt');

    // If no history, return current score as initial point? 
    // Or just let frontend handle it.

    res.json(history);
});

module.exports = { getTrustScoreHistory };
