const User = require('../models/User');
const createNotification = require('./createNotification');

const notifySHGStaff = async (shgId, title, message, type = 'info') => {
    try {
        // Find all admins and bank_viewers belonging to this SHG
        const staff = await User.find({
            shg: shgId,
            role: { $in: ['admin', 'bank_viewer'] },
            isActive: true
        });

        // Create a notification for each staff member
        const notificationPromises = staff.map(user => 
            createNotification(user._id, title, message, type)
        );

        await Promise.all(notificationPromises);
    } catch (error) {
        console.error('Error notifying SHG staff:', error);
    }
};

module.exports = notifySHGStaff;
