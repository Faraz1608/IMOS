import Notification from '../models/Notification.js';

// @desc    Get latest notifications for the logged-in user OR global notifications
// @route   GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    // Fetch user's notifications OR global notifications (user: null)
    // EXCLUDING those where the current user is in the 'deletedBy' array
    const notifications = await Notification.find({
      $and: [
        {
            $or: [{ user: req.user.id }, { user: null }]
        },
        {
            deletedBy: { $ne: req.user.id }
        }
      ]
    })
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
    // Only mark personal notifications or global ones as read (if we tracked read status per user for global, but for now simple)
    // For now, this only affects personal notifications or if we want to track 'read' for global, we'd need a 'readBy' array similar to 'deletedBy'.
    // Given the current schema has a simple 'read' boolean, this likely only works well for personal notifications.
    // We will keep it as is for personal, but for global it's shared state which is tricky.
    // Assuming 'read' is mostly for the single user case.
    await Notification.updateMany(
      { user: req.user.id, read: false }, 
      { read: true }
    );

    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a notification (Smart Delete)
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // If it's a personal notification, delete it permanently
        if (notification.user && notification.user.toString() === req.user.id) {
            await notification.deleteOne();
            return res.status(200).json({ message: 'Notification deleted' });
        }

        // If it's a global notification, add user to deletedBy
        if (!notification.user) {
            if (!notification.deletedBy.includes(req.user.id)) {
                notification.deletedBy.push(req.user.id);
                await notification.save();
            }
            return res.status(200).json({ message: 'Notification removed' });
        }

        return res.status(401).json({ message: 'Not authorized' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};