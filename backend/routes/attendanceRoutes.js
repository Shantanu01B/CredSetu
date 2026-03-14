const express = require('express');
const router = express.Router();
const {
    createMeeting,
    getMeetings,
    markAttendance,
    getMyAttendance,
    getSHGAttendance,
    getGroupAttendanceStats
} = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/meetings')
    .post(protect, admin, createMeeting)
    .get(protect, getMeetings);

router.post('/mark', protect, admin, markAttendance);
router.get('/my', protect, getMyAttendance);
router.get('/stats', protect, admin, getGroupAttendanceStats);
router.get('/shg/:meetingId', protect, admin, getSHGAttendance);

module.exports = router;
