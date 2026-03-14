const SHG = require('../models/SHG');
const User = require('../models/User');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');

const calculateGroupHealthScore = async (shgId) => {
    // 1. Fetch Data
    const shg = await SHG.findById(shgId);
    if (!shg) return;

    const members = await User.find({ shg: shgId });
    const loans = await Loan.find({ shg: shgId });
    const transactions = await Transaction.find({ shg: shgId, type: 'repayment', verified: true });

    // 2. Calculate Components

    // A. Average Member Trust Score (Weight: 40%)
    let totalTrustScore = 0;
    if (members.length > 0) {
        totalTrustScore = members.reduce((acc, member) => acc + (member.trustScore || 0), 0);
    }
    const avgTrustScore = members.length > 0 ? totalTrustScore / members.length : 100;
    // Normalize Trust Score (0-900) to (0-100)
    const normalizedTrustScore = Math.min(avgTrustScore / 9, 100);
    const scoreA = normalizedTrustScore * 0.40;


    // B. Loan Repayment Ratio (Weight: 30%)
    let repaymentRatio = 1; // Default to 100% if no repayments yet
    if (transactions.length > 0) {
        const lateRepayments = transactions.filter(t => t.isLate).length;
        repaymentRatio = (transactions.length - lateRepayments) / transactions.length;
    }
    const scoreB = (repaymentRatio * 100) * 0.30;


    // C. Fund Growth Rate (Weight: 20%)
    // Heuristic: 1000 per member is "good" fund. Max out at 5000 per member? 
    // Let's stick to absolute fund for simplicity as requested "fund growth rate".
    // Or just use totalFund. target = 10000.
    const targetFund = 10000;
    const fundScore = Math.min(shg.totalFund / targetFund, 1) * 100;
    const scoreC = fundScore * 0.20;


    // D. Pending Loan Ratio (Weight: 10% - Negative)
    let pendingRatio = 0;
    if (loans.length > 0) {
        const pendingLoans = loans.filter(l => l.status === 'pending').length;
        pendingRatio = pendingLoans / loans.length;
    }
    const penaltyD = (pendingRatio * 100) * 0.10;


    // 3. Final Calculation
    let totalScore = scoreA + scoreB + scoreC - penaltyD;

    // Clamping 0-100
    if (totalScore > 100) totalScore = 100;
    if (totalScore < 0) totalScore = 0;

    totalScore = Math.round(totalScore);

    // 4. Update SHG
    shg.groupHealthScore = totalScore;
    await shg.save();

    return totalScore;
};

module.exports = calculateGroupHealthScore;
