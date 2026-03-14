const mongoose = require('mongoose');

const trustScoreHistorySchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    score: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const TrustScoreHistory = mongoose.model('TrustScoreHistory', trustScoreHistorySchema);
module.exports = TrustScoreHistory;
