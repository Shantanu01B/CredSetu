const express = require('express');
const router = express.Router();
const { requestLoan, updateLoanStatus, getMyLoans, getSHGLoans } = require('../controllers/loanController');
const { protect, admin, bank } = require('../middleware/authMiddleware');

router.post('/', protect, requestLoan);
router.put('/:id/status', protect, admin, updateLoanStatus);
router.get('/my', protect, getMyLoans);
router.get('/shg', protect, bank, getSHGLoans);

module.exports = router;
