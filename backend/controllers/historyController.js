const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');

// @desc    Get complete financial history for logged in member
// @route   GET /api/history/member
// @access  Private
const getMemberHistory = asyncHandler(async (req, res) => {
    // 1. Fetch all transactions for this user
    const transactions = await Transaction.find({ user: req.user._id })
        .populate('verifiedBy', 'name email')
        .sort({ createdAt: -1 });

    // 2. Fetch all loans for this user
    const loans = await Loan.find({ user: req.user._id })
        .populate('approvedBy', 'name')
        .populate('repaymentHistory')
        .sort({ createdAt: -1 });

    // 3. Format into a unified timeline
    let timeline = [];

    // Map transactions
    transactions.forEach(tx => {
        timeline.push({
            id: tx._id,
            type: tx.type, // 'saving', 'repayment', 'loan_disbursement'
            amount: tx.amount,
            date: tx.createdAt,
            status: tx.verified ? 'verified' : 'pending',
            verifiedBy: tx.verifiedBy ? tx.verifiedBy.name : null,
            remarks: tx.remarks || '',
            paymentMethod: tx.paymentMethod || 'manual',
            documentType: 'transaction'
        });
    });

    // Map loans
    loans.forEach(loan => {
        timeline.push({
            id: loan._id,
            type: 'loan_request',
            amount: loan.amount,
            date: loan.createdAt,
            status: loan.status, // 'pending', 'approved', 'rejected', 'completed'
            approvedBy: loan.approvedBy ? loan.approvedBy.name : null,
            totalRepayable: loan.totalRepayable,
            repaidAmount: loan.repaidAmount,
            documentType: 'loan'
        });
    });

    // Sort timeline chronologically descending
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
        timeline,
        summary: {
            totalSavings: transactions.filter(t => t.type === 'saving' && t.verified).reduce((acc, curr) => acc + curr.amount, 0),
            totalLoansActive: loans.filter(l => l.status === 'approved').reduce((acc, curr) => acc + curr.remainingAmount, 0),
            totalRepaid: transactions.filter(t => t.type === 'repayment' && t.verified).reduce((acc, curr) => acc + curr.amount, 0)
        }
    });
});

// @desc    Get SHG financial history (Admin View)
// @route   GET /api/history/shg
// @access  Private/Admin
const getSHGHistory = asyncHandler(async (req, res) => {
    const { shg } = req.user;
    const { user, type, status, startDate, endDate } = req.query;

    if (!shg) {
        res.status(400);
        throw new Error('No SHG associated with this admin');
    }

    // Build filter objects
    let txQuery = { shg };
    let loanQuery = { shg };

    if (user) {
        txQuery.user = user;
        loanQuery.user = user;
    }

    if (type) {
        if (type === 'loan') {
            txQuery._id = null; // Don't fetch transactions if specifically looking for loans only
        } else {
            txQuery.type = type;
            loanQuery._id = null; // Don't fetch loans if looking for specific transaction types
        }
    }

    if (startDate && endDate) {
        txQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        loanQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (status) {
        if (status === 'verified') txQuery.verified = true;
        if (status === 'pending') txQuery.verified = false;
        loanQuery.status = status;
    }

    const transactions = await Transaction.find(txQuery)
        .populate('user', 'name email')
        .populate('verifiedBy', 'name')
        .sort({ createdAt: -1 });

    const loans = await Loan.find(loanQuery)
        .populate('user', 'name email')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 });

    res.json({
        transactions,
        loans,
        count: transactions.length + loans.length
    });
});

module.exports = { getMemberHistory, getSHGHistory };
