const mongoose = require('mongoose');

const riskAlertSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    shg: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SHG',
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
    },
}, {
    timestamps: true,
});

const RiskAlert = mongoose.model('RiskAlert', riskAlertSchema);
module.exports = RiskAlert;
