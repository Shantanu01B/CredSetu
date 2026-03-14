const Notification = require('../models/Notification');

const createNotification = async (userId, title, message, type = 'info') => {
    try {
        await Notification.create({
            user: userId,
            title,
            message,
            type
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

module.exports = createNotification;
