import Notification from '../models/Notification.js';

/**
 * Creates a notification in the DB and emits it via Socket.io
 * @param {Object} io - Socket.io instance
 * @param {Object} data - Notification data
 * @param {string} [data.user] - User ID (optional, if null it's global)
 * @param {string} data.message - Notification message
 * @param {string} [data.link] - Optional link
 * @returns {Promise<Object>} Created notification object
 */
export const createAndEmitNotification = async (io, { user = null, message, link = '' }) => {
    try {
        const notification = await Notification.create({
            user,
            message,
            link
        });

        if (user) {
            // Emit to specific user room
            io.to(user.toString()).emit('new_notification', notification);
        } else {
            // Emit to all connected clients (for global notifications)
            // Note: Clients should filter if they really need to, but usually global means everyone.
            io.emit('new_notification', notification);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        // Don't throw, just return null so the main flow doesn't break
        return null;
    }
};
