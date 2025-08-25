import express from 'express';
import { getNotifications, markAllAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/').get(getNotifications);
router.route('/read-all').put(markAllAsRead);

export default router;