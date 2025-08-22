import express from 'express';
import {
  runAbcAnalysis,
  getSlottingRecommendations,
} from '../controllers/optimizationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/abc-analysis').post(runAbcAnalysis);

// Make sure this line exists and is correct
router.route('/recommendations').get(getSlottingRecommendations);

export default router;