const asyncHandler = require('express-async-handler');
const SHG = require('../models/SHG');
const User = require('../models/User');

// @desc    Create a new SHG
// @route   POST /api/shg
// @access  Private/Admin
const createSHG = asyncHandler(async (req, res) => {
    const { name, members } = req.body;

    const shgExists = await SHG.findOne({ name });

    if (shgExists) {
        res.status(400);
        throw new Error('SHG already exists');
    }

    const shg = await SHG.create({
        name,
        admin: req.user._id,
        members: members || [],
    });

    if (shg) {
        // Update admin's SHG
        await User.findByIdAndUpdate(req.user._id, { shg: shg._id });

        // Update members' SHG if provided
        if (members && members.length > 0) {
            await User.updateMany(
                { _id: { $in: members } },
                { shg: shg._id }
            );
        }

        res.status(201).json(shg);
    } else {
        res.status(400);
        throw new Error('Invalid SHG data');
    }
});

// @desc    Add member to SHG
// @route   PUT /api/shg/add-member
// @access  Private/Admin
const addMember = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const adminSHG = await SHG.findOne({ admin: req.user._id });

    if (!adminSHG) {
        res.status(404);
        throw new Error('SHG not found for this admin');
    }

    // Find user by email
    const userToAdd = await User.findOne({ email });

    // If not found -> return error
    if (!userToAdd) {
        res.status(404);
        throw new Error('User not found');
    }

    // If user.shg exists -> return error
    if (userToAdd.shg) {
        res.status(400);
        throw new Error(`User already belongs to an SHG`);
    }

    if (adminSHG.members.includes(userToAdd._id)) {
        res.status(400);
        throw new Error('User already in this SHG');
    }

    // Intense logging BEFORE
    console.log(`[SHG_ASSIGN] user.shg before: ${userToAdd.shg}`);
    console.log(`[SHG_ASSIGN] shg.members before: ${JSON.stringify(adminSHG.members)}`);

    // Push user._id into shg.members
    adminSHG.members.push(userToAdd._id);

    // Set user.shg = shg._id
    userToAdd.shg = adminSHG._id;

    // Save BOTH documents
    await adminSHG.save();
    await userToAdd.save();

    // Intense logging AFTER
    console.log(`[SHG_ASSIGN] user.shg after: ${userToAdd.shg}`);
    console.log(`[SHG_ASSIGN] shg.members after: ${JSON.stringify(adminSHG.members)}`);

    // Return updated SHG with populated members
    const populatedSHG = await SHG.findById(adminSHG._id)
        .populate('members', 'name email role trustScore isVerified')
        .populate('admin', 'name email');

    const { emitUpdate } = require('../utils/socket');
    emitUpdate(userToAdd._id.toString(), 'memberAdded', {
        shgId: adminSHG._id,
        shgName: adminSHG.name
    });

    res.json(populatedSHG);
});

// @desc    Get SHG details
// @route   GET /api/shg
// @access  Private
const getSHGDetails = asyncHandler(async (req, res) => {
    if (!req.user.shg) {
        res.status(404);
        throw new Error('User does not belong to an SHG');
    }

    const shg = await SHG.findById(req.user.shg)
        .populate('members', 'name email role trustScore isVerified')
        .populate('admin', 'name email');

    if (shg) {
        res.json(shg);
    } else {
        res.status(404);
        throw new Error('SHG not found');
    }
});

// @desc    Get all SHGs (Bank)
// @route   GET /api/shg/all
// @access  Private/Bank
const getAllSHGs = asyncHandler(async (req, res) => {
    const shgs = await SHG.find()
        .populate('members', 'name email role trustScore isVerified')
        .populate('admin', 'name email');
    res.json(shgs);
});

// @desc    Remove member from SHG
// @route   PUT /api/shg/remove-member
// @access  Private/Admin
const removeMember = asyncHandler(async (req, res) => {
    const { memberId } = req.body;
    const adminSHG = await SHG.findOne({ admin: req.user._id });

    if (!adminSHG) {
        res.status(404);
        throw new Error('SHG not found for this admin');
    }

    adminSHG.members = adminSHG.members.filter(m => m.toString() !== memberId);
    await adminSHG.save();

    await User.findByIdAndUpdate(memberId, { shg: null });

    res.json(adminSHG);
});

// @desc    Verify/Unverify member
// @route   PUT /api/shg/verify-member
// @access  Private/Admin
const updateMemberVerification = asyncHandler(async (req, res) => {
    const { memberId, isVerified } = req.body;
    const adminSHG = await SHG.findOne({ admin: req.user._id });

    if (!adminSHG) {
        res.status(404);
        throw new Error('SHG not found for this admin');
    }

    // Check if member is part of this SHG
    const isMemberInSHG = adminSHG.members.some(m => m.toString() === memberId);
    if (!isMemberInSHG) {
        res.status(400);
        throw new Error('Member is not part of this SHG');
    }

    const member = await User.findByIdAndUpdate(
        memberId,
        { isVerified },
        { new: true }
    ).select('name email role trustScore isVerified');

    if (!member) {
        res.status(404);
        throw new Error('Member not found');
    }

    res.json(member);
});

module.exports = { createSHG, addMember, getSHGDetails, getAllSHGs, removeMember, updateMemberVerification };
