const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;
