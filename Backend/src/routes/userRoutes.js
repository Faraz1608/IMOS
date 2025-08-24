import express from 'express';
import { getUsers, updateUserRole } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes in this file require the user to be logged in and to be an ADMIN
router.use(protect, authorize('ADMIN'));

router.route('/').get(getUsers);
router.route('/:id/role').put(updateUserRole);

export default router;