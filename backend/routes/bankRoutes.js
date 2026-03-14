const express = require('express');
const router = express.Router();
const { getSHGStats } = require('../controllers/bankController');
const { protect, bank } = require('../middleware/authMiddleware');

router.get('/shg/:shgId', protect, bank, getSHGStats);

module.exports = router;
