import express from 'express';
import {
  getInventory,
  setInventory,
  adjustInventory,
  deleteInventory,
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// Routes for the entire inventory collection
router.route('/').get(getInventory).post(setInventory);

// Routes to modify a SINGLE inventory item by its unique ID
router.route('/:id').put(adjustInventory).delete(deleteInventory);

export default router;