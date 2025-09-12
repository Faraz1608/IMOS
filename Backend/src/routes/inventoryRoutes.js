import express from 'express';
import {
  getInventory,
  setInventory,
  adjustInventory,
  deleteInventory,
  moveInventory, // 1. Import the new controller function
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// Routes for the entire inventory collection
router.route('/').get(getInventory).post(setInventory);

// --- New Route ---
// This route is specifically for moving an inventory item.
router.route('/:id/move').put(moveInventory); // 2. Add the new route

// Routes to modify a SINGLE inventory item by its unique ID
router.route('/:id').put(adjustInventory).delete(deleteInventory);

export default router;
  