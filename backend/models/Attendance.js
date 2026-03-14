const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
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
    meeting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting',
        required: true,
    },
    present: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
