const express = require('express');
const router = express.Router();
const { createSHG, addMember, getSHGDetails, getAllSHGs, removeMember, updateMemberVerification } = require('../controllers/shgController');
const { protect, admin, bank } = require('../middleware/authMiddleware');

router.post('/', protect, admin, createSHG);
router.put('/add-member', protect, admin, addMember);
router.put('/remove-member', protect, admin, removeMember);
router.put('/verify-member', protect, admin, updateMemberVerification);
router.get('/all', protect, bank, getAllSHGs);
router.get('/', protect, getSHGDetails);

module.exports = router;
