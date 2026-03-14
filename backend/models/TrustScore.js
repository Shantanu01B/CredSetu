const mongoose = require('mongoose');

const trustScoreSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    score: {
        type: Number,
        default: 100,
        min: 0,
        max: 1000,
    },
    history: [{
        date: {
            type: Date,
            default: Date.now,
        },
        change: {
            type: Number,
        },
        reason: {
            type: String,
        },
        newScore: {
            type: Number,
        },
    }],
}, {
    timestamps: true,
});

const TrustScore = mongoose.model('TrustScore', trustScoreSchema);
module.exports = TrustScore;
