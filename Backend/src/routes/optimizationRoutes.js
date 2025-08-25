import express from 'express';
import {
  runAbcAnalysis,
  getSlottingRecommendations,
  generatePickingRoute, // 1. Import the new function
} from '../controllers/optimizationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/abc-analysis').post(runAbcAnalysis);
router.route('/recommendations').get(getSlottingRecommendations);
router.route('/picking-route').post(generatePickingRoute); // 2. Add the new route

export default router;