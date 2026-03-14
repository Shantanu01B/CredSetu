const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const TrustScoreHistory = require('../models/TrustScoreHistory');
const calculateGroupHealthScore = require('./groupHealth');
const generateRiskAlerts = require('./riskEngine');
const { emitUpdate } = require('./socket');

const calculateTrustScore = async (userId, reason) => {
    let score = 100; // Base score

    // 1. Transactions
    const transactions = await Transaction.find({ user: userId, verified: true });

    transactions.forEach(tx => {
        if (tx.type === 'saving') {
            score += 2;
        } else if (tx.type === 'repayment') {
            if (tx.isLate) {
                score -= 10;
            } else {
                score += 5;
            }
        }
    });

    // 2. Loans
    const loans = await Loan.find({ user: userId });
    loans.forEach(loan => {
        if (loan.status === 'defaulted') {
            score -= 20;
        } else if (loan.status === 'completed') {
            score += 20;
        }
    });

    // 3. Attendance
    const attendanceRecords = await Attendance.find({ user: userId }).sort({ meetingDate: 1 });

    let consecutiveMisses = 0;
    attendanceRecords.forEach(record => {
        if (record.present) {
            score += 1;
            consecutiveMisses = 0;
        } else {
            consecutiveMisses++;
            if (consecutiveMisses >= 3) {
                score -= 5;
                consecutiveMisses = 0;
            }
        }
    });

    // 4. Clamping
    if (score > 900) score = 900;
    if (score < 0) score = 0;

    // 5. Update User
    await User.findByIdAndUpdate(userId, { trustScore: score });

    // 6. Log History
    if (reason) {
        await TrustScoreHistory.create({
            user: userId,
            score,
            reason
        });
    }

    emitUpdate(userId.toString(), 'trustScoreUpdated', {
        score,
        reason: reason || 'Recalculation',
        date: new Date()
    });

    // 7. Update Group Health Score & Risk Alerts
    // calculateTrustScore is called after user, loan, transaction updates
    // so it's a good place to trigger SHG update and Risk Analysis
    const user = await User.findById(userId);
    if (user && user.shg) {
        await calculateGroupHealthScore(user.shg);
        await generateRiskAlerts(user.shg);
    }

    return score;
};

module.exports = calculateTrustScore;
