import User from '../models/User.js';

// @desc    Get all users (Admin only)
// @route   GET /api/users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a user's role (Admin only)
// @route   PUT /api/users/:id/role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: 'User role updated successfully.' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};