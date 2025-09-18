import express from 'express';
import { 
  getInventoryReport, 
  getStockoutReport, 
  getSlowMovingReport,
  getGiReport,  // --- NEW ---
  getGrReport   // --- NEW ---
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/inventory').get(getInventoryReport);
router.route('/stockout').get(getStockoutReport);
router.route('/slow-moving').get(getSlowMovingReport);
router.route('/gi-report').get(getGiReport); // --- NEW ---
router.route('/gr-report').get(getGrReport); // --- NEW ---

export default router;