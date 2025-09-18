import Notification from '../models/Notification.js';

// @desc    Get latest notifications for the logged-in user
// @route   GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    // Fetch user's notifications, sorted by newest first, limited to 20
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 }) 
      .limit(20); 

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Mark all notifications as read for the logged-in user
// @route   PUT /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false }, 
      { read: true }
    );

    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
