import express from 'express';
import { getLocations, addLocation } from '../controllers/locationController.js';
import { protect } from '../middleware/authMiddleware.js';

// The { mergeParams: true } option is crucial for accessing params from the parent router (layoutId)
const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(getLocations)
  .post(addLocation);

export default router;