const asyncHandler = require('express-async-handler');
const OTP = require('../models/OTP');
const User = require('../models/User');

// @desc    Send OTP (Mock)
// @route   POST /api/otp/send
// @access  Private
const sendOTP = asyncHandler(async (req, res) => {
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Create OTP record
    await OTP.create({
        user: req.user._id,
        otp: otpCode,
        expiresAt,
        verified: false,
    });

    // In production, send via SMS integration (Twilio/Fast2SMS)
    // For now, return in response
    res.json({ message: 'OTP Sent (Mock)', otp: otpCode });
});

// @desc    Verify OTP
// @route   POST /api/otp/verify
// @access  Private
const verifyOTP = asyncHandler(async (req, res) => {
    const { otp } = req.body;

    const record = await OTP.findOne({
        user: req.user._id,
        otp,
        verified: false,
        expiresAt: { $gt: Date.now() }, // Not expired
    }).sort({ createdAt: -1 }); // Get latest

    if (record) {
        record.verified = true;
        await record.save();
        res.json({ message: 'OTP Verified', verified: true, otpId: record._id });
    } else {
        res.status(400);
        throw new Error('Invalid or Expired OTP');
    }
});

module.exports = { sendOTP, verifyOTP };
