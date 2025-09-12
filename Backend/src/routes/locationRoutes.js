import express from 'express';
import { 
  getLocations,
  addLocation, 
  updateLocation, 
  deleteLocation,
  getLocationStats, // 1. Import new controller
} from '../controllers/locationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(getLocations)
  .post(addLocation);

// 2. Add new route for stats
router.route('/:locationId/stats')
    .get(getLocationStats);

router.route('/:locationId')
  .put(updateLocation)
  .delete(deleteLocation);
  
export default router;
