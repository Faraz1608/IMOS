import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js'; // Import the middleware

const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Route
// We add the 'protect' middleware before the controller function.
// The request will only reach the controller if 'protect' calls next().
router.get('/me', protect, (req, res) => {
  // Because the 'protect' middleware ran successfully,
  // we have the user's data available in req.user.
  res.status(200).json(req.user);
});

export default router;