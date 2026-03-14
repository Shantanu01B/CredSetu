const express = require('express');
const router = express.Router();
const { createTransaction, verifyTransaction, getMyTransactions, getSHGTransactions } = require('../controllers/transactionController');
const { protect, admin, bank } = require('../middleware/authMiddleware');

router.post('/', protect, createTransaction);
router.put('/:id/verify', protect, admin, verifyTransaction);
router.get('/my', protect, getMyTransactions);
router.get('/shg', protect, bank, getSHGTransactions);

module.exports = router;
