import express from 'express';
import {
  createDispatch,
  getDispatches,
  updateDispatchStatus,
} from '../controllers/dispatchController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').post(createDispatch).get(getDispatches);
router.route('/:id/status').put(updateDispatchStatus);

export default router;