import express from 'express';
import {
  getSKUs,
  createSKU,
  searchSkus,
  getSkuById, 
  updateSku,
  deleteSku
} from '../controllers/skuController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/search').get(searchSkus);

router.route('/').get(getSKUs).post(createSKU);
router.route('/:id').get(getSkuById).put(updateSku).delete(deleteSku);

export default router;