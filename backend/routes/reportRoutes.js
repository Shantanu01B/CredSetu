const express = require('express');
const router = express.Router();
const { getMemberReport, getSHGReport } = require('../controllers/reportController');
const { protect, admin, bank } = require('../middleware/authMiddleware');

router.get('/member/:userId', protect, getMemberReport);
router.get('/shg/:shgId', protect, bank, getSHGReport);

module.exports = router;
