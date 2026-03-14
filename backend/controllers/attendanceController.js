const asyncHandler = require('express-async-handler');
const Meeting = require('../models/Meeting');
const SHG = require('../models/SHG');
const Attendance = require('../models/Attendance');
const calculateTrustScore = require('../utils/trustScore');
const { getIO } = require('../utils/socket');

// @desc    Create a new meeting
// @route   POST /api/attendance/meetings
// @access  Private/Admin
const createMeeting = asyncHandler(async (req, res) => {
    const { title, description, meetingDate, location, absentMembers } = req.body;

    if (!req.user.shg) {
        res.status(400);
        throw new Error('Admin must belong to an SHG');
    }

    const shgId = req.user.shg;

    const meeting = await Meeting.create({
        shg: shgId,
        title,
        description,
        meetingDate: meetingDate || Date.now(),
        location
    });

    // If absentMembers is provided (even if empty, meaning all present), automatically mark attendance
    if (absentMembers && Array.isArray(absentMembers)) {
        const shg = await SHG.findById(shgId).populate('members');
        if (shg && shg.members) {
            for (const member of shg.members) {
                const isPresent = !absentMembers.includes(member._id.toString());

                await Attendance.create({
                    user: member._id,
                    shg: shgId,
                    meeting: meeting._id,
                    present: isPresent
                });

                // Update Trust Score
                await calculateTrustScore(member._id, 'Meeting Attendance (Auto)');
            }

            // Emit real-time event to the SHG room
            getIO().to(`shg_${shgId}`).emit('attendanceMarked', meeting._id);
        }
    }

    res.status(201).json(meeting);
});

// @desc    Get SHG meetings
// @route   GET /api/attendance/meetings
// @access  Private
const getMeetings = asyncHandler(async (req, res) => {
    if (!req.user.shg) {
        res.status(400);
        throw new Error('User must belong to an SHG');
    }

    const meetings = await Meeting.find({ shg: req.user.shg }).sort({ meetingDate: -1 });
    res.json(meetings);
});

// @desc    Mark Attendance (Batch)
// @route   POST /api/attendance/mark
// @access  Private/Admin
const markAttendance = asyncHandler(async (req, res) => {
    const { meetingId, records } = req.body; // records: [{ userId, present }]

    if (!req.user.shg) {
        res.status(400);
        throw new Error('Admin must belong to an SHG');
    }

    const shg = await SHG.findById(req.user.shg);
    if (shg.admin.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
        res.status(404);
        throw new Error('Meeting not found');
    }

    const processed = [];

    for (const record of records) {
        const { userId, present } = record;

        // Upsert attendance record
        let attendance = await Attendance.findOne({
            user: userId,
            shg: req.user.shg,
            meeting: meetingId
        });

        if (attendance) {
            attendance.present = present;
            await attendance.save();
        } else {
            attendance = await Attendance.create({
                user: userId,
                shg: req.user.shg,
                meeting: meetingId,
                present
            });
        }

        // Update Trust Score
        await calculateTrustScore(userId, 'Attendance Marked');

        processed.push(attendance);
    }

    // Emit real-time event to the SHG room
    getIO().to(`shg_${req.user.shg}`).emit('attendanceMarked', meetingId);

    res.status(201).json(processed);
});

// @desc    Get Attendance History (Member)
// @route   GET /api/attendance/my
// @access  Private
const getMyAttendance = asyncHandler(async (req, res) => {
    const history = await Attendance.find({ user: req.user._id })
        .populate('meeting')
        .sort({ createdAt: -1 });
    res.json(history);
});

// @desc    Get SHG Attendance for a meeting (Admin)
// @route   GET /api/attendance/shg/:meetingId
// @access  Private/Admin
const getSHGAttendance = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const history = await Attendance.find({ shg: req.user.shg, meeting: meetingId })
        .populate('user', 'name')
        .sort({ createdAt: -1 });
    res.json(history);
});
// @desc    Get Group Attendance Stats (Admin)
// @route   GET /api/attendance/stats
// @access  Private/Admin
const getGroupAttendanceStats = asyncHandler(async (req, res) => {
    if (!req.user.shg) {
        res.status(400);
        throw new Error('Admin must belong to an SHG');
    }

    const shg = await SHG.findById(req.user.shg).populate('members', 'name email');
    if (!shg) {
        res.status(404);
        throw new Error('SHG not found');
    }

    const totalMeetingsCount = await Meeting.countDocuments({ shg: req.user.shg });

    if (totalMeetingsCount === 0) {
        return res.json(shg.members.map(m => ({
            userId: m._id,
            name: m.name,
            email: m.email,
            percentage: 0,
            presentCount: 0,
            totalMeetings: 0
        })));
    }

    const stats = [];
    for (const member of shg.members) {
        const presentCount = await Attendance.countDocuments({
            shg: req.user.shg,
            user: member._id,
            present: true
        });

        const percentage = Math.round((presentCount / totalMeetingsCount) * 100);

        stats.push({
            userId: member._id,
            name: member.name,
            email: member.email,
            percentage,
            presentCount,
            totalMeetings: totalMeetingsCount
        });
    }

    res.json(stats);
});

module.exports = { createMeeting, getMeetings, markAttendance, getMyAttendance, getSHGAttendance, getGroupAttendanceStats };
