import Sku from '../models/Sku.js';
import Dispatch from '../models/Dispatch.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Layout from '../models/Layout.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';

// @desc    Get all dashboard statistics
// @route   GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    // --- KPI Card Stats ---
    const totalSkus = await Sku.countDocuments();
    const pendingDispatches = await Dispatch.countDocuments({ status: 'Pending Dispatch' });
    
    // --- Role Distribution ---
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const activeUsers = userRoles.reduce((acc, role) => acc + role.count, 0);

    // --- Layout Space Utilization ---
    const layouts = await Layout.find({ createdBy: req.user.id });
    const layoutStatsPromises = layouts.map(async (layout) => {
      const totalLocations = await Location.countDocuments({ layout: layout._id });
      const occupiedLocationsResult = await Inventory.distinct('location', { 
          location: { $in: await Location.find({ layout: layout._id }).distinct('_id') } 
      });
      const spaceUtilization = totalLocations > 0 ? (occupiedLocationsResult.length / totalLocations) * 100 : 0;
      return {
        name: layout.name,
        utilization: parseFloat(spaceUtilization.toFixed(2)),
      };
    });
    const layoutUtilization = await Promise.all(layoutStatsPromises);

    // --- Recent Transactions ---
    const recentTransactions = await Transaction.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // --- Inventory Status (Recent Dispatches) ---
    const inventoryStatus = await Dispatch.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('items.sku', 'name');

    res.status(200).json({
      totalSkus,
      pendingDispatches,
      activeUsers,
      userRoles,
      layoutUtilization,
      recentTransactions,
      inventoryStatus 
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};