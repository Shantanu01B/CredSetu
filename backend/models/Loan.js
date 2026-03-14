const mongoose = require('mongoose');

const loanSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    shg: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SHG',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    interestRate: {
        type: Number,
        required: true, // Annual or monthly? Assuming monthly 2% based on typical SHG
    },
    totalRepayable: {
        type: Number,
        required: true,
    },
    repaidAmount: {
        type: Number,
        default: 0,
    },
    remainingAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'defaulted'],
        default: 'pending',
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    approvedAt: {
        type: Date,
    },
    repaymentHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
    }],
    completedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

const Loan = mongoose.model('Loan', loanSchema);
module.exports = Loan;
