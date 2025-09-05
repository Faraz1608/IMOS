import express from 'express';
import {
  runAbcAnalysis,
  getSlottingRecommendations,
  generatePickingRoute,
  getLayoutOptimizationRecommendations,
  calculateReorderPoints
} from '../controllers/optimizationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/abc-analysis').post(runAbcAnalysis);
router.route('/recommendations').get(getSlottingRecommendations);
router.route('/picking-route').post(generatePickingRoute);
router.route('/layout-optimization').get(getLayoutOptimizationRecommendations);
router.route('/reorder-analysis').post(calculateReorderPoints);

export default router;