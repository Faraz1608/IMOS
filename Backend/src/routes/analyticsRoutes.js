import express from 'express';
import { getAgingReport, getDemandForecast } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/aging-report').get(getAgingReport);
router.route('/demand-forecast').get(getDemandForecast); // Add new route

export default router;