const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const SHG = require('../models/SHG');
const calculateTrustScore = require('../utils/trustScore');
const createNotification = require('../utils/createNotification');

// @desc    Create a transaction (Saving/Repayment)
// @route   POST /api/transactions
// @access  Private
const createTransaction = asyncHandler(async (req, res) => {
    const { type, amount, otpId } = req.body;

    if (!req.user.shg) {
        res.status(400);
        throw new Error('Transaction failed: You must belong to an SHG to perform this action.');
    }

    if (type === 'repayment') {
        const OTP = require('../models/OTP');
        if (!otpId) {
            res.status(400);
            throw new Error('OTP verification required for repayment');
        }
        const otpRecord = await OTP.findById(otpId);
        if (!otpRecord || !otpRecord.verified || otpRecord.user.toString() !== req.user._id.toString()) {
            res.status(400);
            throw new Error('Invalid or Unverified OTP');
        }
    }

    const transaction = await Transaction.create({
        user: req.user._id,
        shg: req.user.shg,
        type,
        amount,
        verified: false,
    });

    await createNotification(
        req.user._id,
        'Transaction Submitted',
        `Your ${type} transaction of ₹${amount} is pending verification.`,
        'info'
    );

    res.status(201).json(transaction);
});

// @desc    Verify transaction (Admin only)
// @route   PUT /api/transactions/:id/verify
// @access  Private/Admin
const verifyTransaction = asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    if (transaction.verified) {
        res.status(400);
        throw new Error('Transaction already verified');
    }

    const shg = await SHG.findById(transaction.shg);

    // Ensure admin owns this SHG
    if (shg.admin.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to verify this transaction');
    }

    const { isLate, remarks } = req.body;

    transaction.verified = true;
    transaction.verifiedBy = req.user._id;
    if (remarks) transaction.remarks = remarks;
    if (isLate !== undefined) transaction.isLate = isLate;

    await transaction.save();

    // Update SHG total fund
    if (transaction.type === 'saving' || transaction.type === 'repayment') {
        shg.totalFund += transaction.amount;
    }

    // Update Loan balance if repayment
    if (transaction.type === 'repayment') {
        const Loan = require('../models/Loan');
        const loan = await Loan.findOne({
            user: transaction.user,
            status: 'approved'
        });

        if (loan) {
            loan.repaidAmount = (loan.repaidAmount || 0) + transaction.amount;
            loan.remainingAmount -= transaction.amount;
            loan.repaymentHistory.push(transaction._id);
            if (loan.remainingAmount <= 0) {
                loan.remainingAmount = 0;
                loan.status = 'completed';
                loan.completedAt = new Date();
            }
            await loan.save();
        }
    }

    await shg.save();

    res.json(transaction); // Send JSON response immediately so UI updates fast

    // Run side effects asynchronously in background:
    try {
        await createNotification(
            transaction.user,
            'Transaction Verified',
            `Your ${transaction.type} transaction of ₹${transaction.amount} has been verified!`,
            'success'
        );

        // Update Trust Score
        const reason = `Transaction Verified: ${transaction.type}`;
        await calculateTrustScore(transaction.user, reason);

        const { emitUpdate } = require('../utils/socket');
        emitUpdate(transaction.user.toString(), 'transactionVerified', {
            type: transaction.type,
            amount: transaction.amount
        });
    } catch (err) {
        console.error('[Verify] Background tasks failed:', err);
    }
});

// @desc    Get my transactions
// @route   GET /api/transactions/my
// @access  Private
const getMyTransactions = asyncHandler(async (req, res) => {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
});

// @desc    Get SHG transactions (Admin/Bank)
// @route   GET /api/transactions/shg
// @access  Private (Admin/Bank)
const getSHGTransactions = asyncHandler(async (req, res) => {
    const transactions = await Transaction.find({ shg: req.user.shg })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
    res.json(transactions);
});

module.exports = { createTransaction, verifyTransaction, getMyTransactions, getSHGTransactions };
