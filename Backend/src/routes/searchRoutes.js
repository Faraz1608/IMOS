import express from 'express';
import { searchUnits } from '../controllers/searchController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/').get(searchUnits);

export default router;