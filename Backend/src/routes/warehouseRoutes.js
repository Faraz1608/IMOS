import express from 'express';
import { getWarehouse, createOrUpdateWarehouse, getWarehouseLayouts } from '../controllers/warehouseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getWarehouse)
  .post(createOrUpdateWarehouse);

router.route('/layouts').get(getWarehouseLayouts); // --- NEW ---

export default router;