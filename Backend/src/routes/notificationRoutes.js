import express from 'express';
import { getNotifications, markAllAsRead, deleteNotification, deleteAllNotifications } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
// All routes in this file require a user to be logged in
router.use(protect);

router.route('/').get(getNotifications).delete(deleteAllNotifications);
router.route('/read-all').put(markAllAsRead);
router.route('/:id').delete(deleteNotification);

export default router;