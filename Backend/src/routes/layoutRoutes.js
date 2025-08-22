import express from 'express';
import {
  getLayouts,
  createLayout,
  getLayoutById,
  updateLayout,
  deleteLayout,
  getLayoutStats,
} from '../controllers/layoutController.js';
import { protect } from '../middleware/authMiddleware.js';
import locationRouter from './locationRoutes.js'; // Import the location router

const router = express.Router();

router.use(protect);

// Re-route requests for a specific layout's locations to the location router
router.use('/:layoutId/locations', locationRouter);

router.route('/')
  .get(getLayouts)
  .post(createLayout);

router.route('/:id')
  .get(getLayoutById)
  .put(updateLayout)
  .delete(deleteLayout);

router.route('/:id/stats').get(getLayoutStats);

export default router;