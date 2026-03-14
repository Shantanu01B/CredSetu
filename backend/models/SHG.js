const mongoose = require('mongoose');

const shgSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    totalFund: {
        type: Number,
        default: 0,
    },
    groupTrustScore: {
        type: Number,
        default: 100,
    },
    groupHealthScore: {
        type: Number,
        default: 100,
    },
}, {
    timestamps: true,
});

const SHG = mongoose.model('SHG', shgSchema);
module.exports = SHG;
