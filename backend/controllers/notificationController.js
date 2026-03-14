const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);
    res.json(notifications);
});

const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }
    if (notification.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
});

const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { user: req.user._id, read: false },
        { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
});

const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ count });
});

module.exports = { getNotifications, markAsRead, markAllAsRead, getUnreadCount };
