import express from 'express';
import { getAgingReport } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/aging-report').get(getAgingReport);

export default router;