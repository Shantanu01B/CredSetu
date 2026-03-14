const asyncHandler = require('express-async-handler');
const SHG = require('../models/SHG');
const User = require('../models/User');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const RiskAlert = require('../models/RiskAlert');

// @desc    Get Aggregated SHG Data for Bank View
// @route   GET /api/bank/shg/:shgId
// @access  Private (Bank/Admin)
const getSHGStats = asyncHandler(async (req, res) => {
    const shgId = req.params.shgId;

    // 1. Fetch SHG & Members
    const shg = await SHG.findById(shgId).populate('members', 'name email trustScore role');
    if (!shg) {
        res.status(404);
        throw new Error('SHG not found');
    }

    // 2. Fetch Loans
    const loans = await Loan.find({ shg: shgId });
    const totalDisbursed = loans.reduce((acc, l) => acc + l.amount, 0);
    const activeLoans = loans.filter(l => l.status === 'approved');
    const pendingLoans = loans.filter(l => l.status === 'pending');
    const defaultedLoans = loans.filter(l => l.status === 'defaulted');

    // 3. Calculate Repayment Ratio (Simplified)
    // Ratio = (Total Repaid / Total Repayable of Closed Loans) * 100
    // For now, using a mock calculation based on defaulted vs total loans if no closed loans
    let repaymentRatio = 100;
    if (loans.length > 0) {
        const closedLoans = loans.filter(l => l.status === 'paid');
        const defaultCount = defaultedLoans.length;
        if (defaultCount > 0) {
            repaymentRatio = Math.max(0, 100 - (defaultCount / loans.length) * 100);
        }
    }

    // 4. Average Trust Score
    const members = shg.members;
    const avgTrustScore = members.length > 0
        ? Math.round(members.reduce((acc, m) => acc + m.trustScore, 0) / members.length)
        : 0;

    // 5. Risk Alerts (Recent 5)
    const recentAlerts = await RiskAlert.find({ shg: shgId })
        .sort({ createdAt: -1 })
        .limit(5);

    res.json({
        shgDetails: {
            name: shg.name,
            totalFund: shg.totalFund,
            groupHealthScore: shg.groupHealthScore,
            memberCount: members.length,
            createdAt: shg.createdAt
        },
        financials: {
            totalDisbursed,
            activeLoansCount: activeLoans.length,
            pendingLoansCount: pendingLoans.length,
            defaultedLoansCount: defaultedLoans.length,
            repaymentRatio: Math.round(repaymentRatio)
        },
        trustMetrics: {
            avgMemberTrustScore: avgTrustScore,
            members: members.map(m => ({
                id: m._id,
                name: m.name,
                trustScore: m.trustScore,
                role: m.role
            }))
        },
        riskAnalysis: {
            recentAlerts
        }
    });
});

module.exports = { getSHGStats };
