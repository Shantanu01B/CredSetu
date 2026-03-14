const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
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
    type: {
        type: String,
        enum: ['saving', 'repayment', 'loan_disbursement'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    isLate: {
        type: Boolean,
        default: false,
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Admin who verified it
    },
    remarks: {
        type: String,
    },
    paymentMethod: {
        type: String,
        enum: ['manual', 'razorpay', 'otp'],
        default: 'manual',
    },
    paymentId: {
        type: String,
        unique: true,
        sparse: true,
    },
}, {
    timestamps: true,
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
