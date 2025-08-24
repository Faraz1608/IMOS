import express from 'express';
import { getInventoryReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/inventory').get(getInventoryReport);

export default router;