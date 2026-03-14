const mongoose = require('mongoose');

const meetingSchema = mongoose.Schema({
    shg: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SHG',
        required: true,
    },
    title: {
        type: String,
        required: true,
        default: 'Monthly Meeting',
    },
    description: {
        type: String,
    },
    meetingDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    location: {
        type: String,
    },
}, {
    timestamps: true,
});

const Meeting = mongoose.model('Meeting', meetingSchema);
module.exports = Meeting;
