const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const SHG = require('../models/SHG');
const OTP = require('../models/OTP'); // Import OTP model
const calculateTrustScore = require('../utils/trustScore');

// Initialize Razorpay
// Note: Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are in .env
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
    const { amount } = req.body;

    if (!amount) {
        res.status(400);
        throw new Error('Please enter amount');
    }

    const options = {
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500);
        throw new Error('Razorpay Order Creation Failed');
    }
});

// @desc    Verify Razorpay Payment & Create Transaction
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, otpId } = req.body;

    // 1. Verify OTP (Double check security)
    if (!otpId) {
        res.status(400);
        throw new Error('OTP verification required');
    }
    const otpRecord = await OTP.findById(otpId);
    if (!otpRecord || !otpRecord.verified || otpRecord.user.toString() !== req.user._id.toString()) {
        res.status(400);
        throw new Error('Invalid or Unverified OTP');
    }

    // 2. Verify Signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        // 2.5 Check for duplicate payment (Double safety)
        const existingTx = await Transaction.findOne({ paymentId: razorpay_payment_id });
        if (existingTx) {
            res.status(400);
            throw new Error('Transaction already exists for this Payment ID');
        }

        // 3. Create Transaction
        const transaction = await Transaction.create({
            user: req.user._id,
            shg: req.user.shg,
            type: 'repayment',
            amount: amount, // Amount in Rupees
            verified: true, // Auto-verified by payment gateway
            paymentId: razorpay_payment_id,
        });

        // 4. Update SHG Fund
        const shg = await SHG.findById(req.user.shg);
        if (shg) {
            shg.totalFund += Number(amount);
            await shg.save();
        }

        // 4.5 Update Loan balance
        const Loan = require('../models/Loan');
        const loan = await Loan.findOne({
            user: req.user._id,
            status: 'approved'
        });

        if (loan) {
            loan.remainingAmount -= Number(amount);
            if (loan.remainingAmount <= 0) {
                loan.remainingAmount = 0;
                loan.status = 'completed';
            }
            await loan.save();
        }

        // 5. Update Trust Score
        const reason = 'Loan Repayment (Online)';
        await calculateTrustScore(req.user._id, reason);

        res.json({
            message: 'Payment Verified and Transaction Created',
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
        });
    } else {
        res.status(400);
        throw new Error('Invalid Signature');
    }
});

module.exports = { createOrder, verifyPayment };
