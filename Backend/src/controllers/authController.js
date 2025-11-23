import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

/**
 * @desc   Register a new user
 * @route  POST /api/auth/register
 * @access Public
 */
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  const role = 'INVENTORY_MANAGER';

  try {
    // Check if email or username already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User with that email or username already exists' });
    }

    // Create new user instance
    user = new User({ username, email, password, role });

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

/**
 * @desc   Authenticate user & return JWT token
 * @route  POST /api/auth/login
 * @access Public
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // JWT payload contains minimal info (id + role)
    const payload = {
      user: { id: user.id, role: user.role },
    };

    // Sign token with 24h expiry
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    res.status(500).send('Server error');
  }
};
