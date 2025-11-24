import express from 'express';
import { getDashboardStats, getDetailedUtilization } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All dashboard routes are protected
router.use(protect);

router.route('/stats').get(getDashboardStats);
router.route('/utilization').get(getDetailedUtilization);

export default router;