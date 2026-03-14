const express = require('express');
const router = express.Router();
const { getRiskAlerts, getMySHGAlerts } = require('../controllers/riskController');
const { protect, admin, bank } = require('../middleware/authMiddleware');

router.get('/my-shg', protect, getMySHGAlerts);
router.get('/:shgId', protect, admin, getRiskAlerts);

module.exports = router;
