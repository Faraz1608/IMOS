import express from 'express';
// Add getInventoryByLocation to this import list
import {
  setInventory,
  getInventoryByLocation,
  getInventoryBySKU,
  adjustInventory, // Add this
  deleteInventory,
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/').post(setInventory).put(adjustInventory).delete(deleteInventory);
router.route('/location/:locationId').get(getInventoryByLocation);
router.route('/sku/:skuId').get(getInventoryBySKU);

export default router;