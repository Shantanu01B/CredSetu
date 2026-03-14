const express = require('express');
const router = express.Router();
const { getMemberHistory, getSHGHistory } = require('../controllers/historyController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/member', protect, getMemberHistory);
router.get('/shg', protect, admin, getSHGHistory);

module.exports = router;
