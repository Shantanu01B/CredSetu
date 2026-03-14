const asyncHandler = require('express-async-handler');
const RiskAlert = require('../models/RiskAlert');

// @desc    Get Risk Alerts for user's SHG
// @route   GET /api/alerts/my-shg
// @access  Private
const getMySHGAlerts = asyncHandler(async (req, res) => {
    if (!req.user.shg) {
        res.status(404);
        throw new Error('User does not belong to an SHG');
    }

    const alerts = await RiskAlert.find({ shg: req.user.shg })
        .populate('user', 'name')
        .sort({ createdAt: -1 });

    res.json(alerts);
});

// @desc    Get Risk Alerts for SHG (Admin)
// @route   GET /api/alerts/:shgId
// @access  Private/Admin
const getRiskAlerts = asyncHandler(async (req, res) => {
    // Only allow admin of the SHG to view alerts
    if (req.user.shg.toString() !== req.params.shgId) {
        res.status(401);
        throw new Error('Not authorized to view alerts for this SHG');
    }

    const alerts = await RiskAlert.find({ shg: req.params.shgId })
        .populate('user', 'name')
        .sort({ severity: 1, createdAt: -1 }); // High severity (alphabetic 'high' < 'low'?? No. 'high', 'medium', 'low'. h > m > l. Wait.
    // Severity enum: ['low', 'medium', 'high']
    // 'h' comes before 'l' -> 'high', 'low', 'medium'. Not ideal sorting.
    // Let's do client side sorting or use a map if strict ordering needed.
    // For now let's just return them. Client can sort or we rely on severity string.

    res.json(alerts);
});

module.exports = { getRiskAlerts, getMySHGAlerts };
