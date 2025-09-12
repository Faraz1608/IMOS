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
    const totalSkus = await Sku.countDocuments({ createdBy: req.user.id });
    const pendingDispatches = await Dispatch.countDocuments({ approvedBy: req.user.id, status: 'Pending Dispatch' });
    
    // --- Role Distribution ---
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const activeUsers = userRoles.reduce((acc, role) => acc + role.count, 0);

    // --- Volumetric Layout Space Utilization ---
    const layouts = await Layout.find({ createdBy: req.user.id });
    const layoutStatsPromises = layouts.map(async (layout) => {
      const locations = await Location.find({ layout: layout._id });
      let totalLayoutCapacity = 0;
      locations.forEach(loc => {
          if (loc.properties && loc.properties.dimensions) {
              totalLayoutCapacity += (loc.properties.dimensions.w || 0) * (loc.properties.dimensions.d || 0) * (loc.properties.dimensions.h || 0);
          }
      });

      const inventoryInLayout = await Inventory.find({ location: { $in: locations.map(l => l._id) } }).populate('sku');
      let totalOccupiedVolume = 0;
      inventoryInLayout.forEach(item => {
          if (item.sku && item.sku.properties && item.sku.properties.dimensions) {
              const skuVolume = (item.sku.properties.dimensions.w || 0) * (item.sku.properties.dimensions.d || 0) * (item.sku.properties.dimensions.h || 0);
              totalOccupiedVolume += skuVolume * item.quantity;
          }
      });

      const spaceUtilization = totalLayoutCapacity > 0 ? (totalOccupiedVolume / totalLayoutCapacity) * 100 : 0;
      return {
        name: layout.name,
        utilization: parseFloat(spaceUtilization.toFixed(2)),
      };
    });
    const layoutUtilization = await Promise.all(layoutStatsPromises);

    // --- Recent Transactions ---
    const recentTransactions = await Transaction.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // --- Inventory Status (Recent Dispatches) ---
    const inventoryStatus = await Dispatch.find({ approvedBy: req.user.id })
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

