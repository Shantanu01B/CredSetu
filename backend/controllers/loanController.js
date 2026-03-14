const asyncHandler = require('express-async-handler');
const Loan = require('../models/Loan');
const SHG = require('../models/SHG');
const calculateTrustScore = require('../utils/trustScore');
const createNotification = require('../utils/createNotification');

const Transaction = require('../models/Transaction');

// @desc    Request a loan
// @route   POST /api/loans
// @access  Private
const requestLoan = asyncHandler(async (req, res) => {
    const { amount, durationMonths } = req.body;

    if (!req.user.shg) {
        res.status(400);
        throw new Error('Loan request failed: You must belong to an SHG to request a loan.');
    }

    const interestRate = 2; // 2% per month
    const interest = (amount * interestRate * durationMonths) / 100;
    const totalRepayable = Number(amount) + Number(interest);

    const loan = await Loan.create({
        user: req.user._id,
        shg: req.user.shg,
        amount,
        interestRate,
        totalRepayable,
        remainingAmount: totalRepayable,
        status: 'pending',
    });

    await createNotification(
        req.user._id,
        'Loan Request Submitted',
        `Your loan request for ₹${amount} has been submitted and is pending approval.`,
        'info'
    );

    res.status(201).json(loan);
});

// @desc    Approve or Reject Loan (Admin only)
// @route   PUT /api/loans/:id/status
// @access  Private/Admin
const updateLoanStatus = asyncHandler(async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
        res.status(404);
        throw new Error('Loan not found');
    }

    const shg = await SHG.findById(loan.shg);

    if (shg.admin.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to manage loans for this SHG');
    }

    if (loan.status !== 'pending') {
        res.status(400);
        throw new Error('Loan is already processed');
    }

    if (status === 'approved') {
        if (shg.totalFund < loan.amount) {
            res.status(400);
            throw new Error('Insufficient funds in SHG');
        }
        shg.totalFund -= loan.amount;
        await shg.save();

        // Create loan disbursement transaction for history tracking
        const disbursementTx = await Transaction.create({
            user: loan.user,
            shg: loan.shg,
            type: 'loan_disbursement',
            amount: loan.amount,
            verified: true,
            verifiedBy: req.user._id,
            remarks: 'System Auto-Generated: Loan Disbursement'
        });

        loan.approvedBy = req.user._id;
        loan.approvedAt = new Date();
    }

    loan.status = status;
    await loan.save();

    const notificationType = status === 'approved' ? 'success' : 'warning';
    const notificationMessage = status === 'approved'
        ? `Your loan request for ₹${loan.amount} has been approved!`
        : `Your loan request for ₹${loan.amount} has been rejected.`;

    await createNotification(loan.user, 'Loan Status Update', notificationMessage, notificationType);

    const reason = `Loan Status Updated: ${status}`;
    await calculateTrustScore(loan.user, reason);

    const { emitUpdate } = require('../utils/socket');
    emitUpdate(loan.user.toString(), 'loanStatusUpdated', {
        status,
        amount: loan.amount
    });

    res.json(loan);
});

// @desc    Get my loans
// @route   GET /api/loans/my
// @access  Private
const getMyLoans = asyncHandler(async (req, res) => {
    const loans = await Loan.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(loans);
});

// @desc    Get SHG loan requests
// @route   GET /api/loans/shg
// @access  Private (Admin/Bank)
const getSHGLoans = asyncHandler(async (req, res) => {
    const loans = await Loan.find({ shg: req.user.shg })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
    res.json(loans);
});

module.exports = { requestLoan, updateLoanStatus, getMyLoans, getSHGLoans };
