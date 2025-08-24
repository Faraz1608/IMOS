import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All dashboard routes are protected
router.use(protect);

router.route('/stats').get(getDashboardStats);

export default router;