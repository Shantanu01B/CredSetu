const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate({
        path: 'shg',
        populate: {
            path: 'members',
            select: 'name email role trustScore isVerified'
        }
    });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            shg: user.shg,
            trustScore: user.trustScore,
            isVerified: user.isVerified,
            isActive: user.isActive,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    // Find user by ID from JWT and populate shg
    const user = await User.findById(req.user._id).populate({
        path: 'shg',
        populate: {
            path: 'members',
            select: 'name email role trustScore isVerified'
        }
    });

    if (user) {
        console.log(`[PROFILE] Fetched fresh profile for ${user.email}. SHG: ${user.shg ? user.shg.name : 'None'}`);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            shg: user.shg,
            trustScore: user.trustScore,
            isVerified: user.isVerified,
            isActive: user.isActive,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = { authUser, registerUser, getUserProfile };
