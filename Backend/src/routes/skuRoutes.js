import express from 'express';
import {
  getSKUs,
  createSKU,
  searchSkus
} from '../controllers/skuController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/search').get(searchSkus);

router.route('/').get(getSKUs).post(createSKU);

export default router;