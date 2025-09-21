import Sku from '../models/Sku.js';
import Dispatch from '../models/Dispatch.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Layout from '../models/Layout.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';

// Get all dashboard statistics for the entire system
export const getDashboardStats = async (req, res) => {
  try {
    // --- KPI Card Stats ---
    const totalSkus = await Sku.countDocuments();
    const pendingDispatches = await Dispatch.countDocuments({ status: 'Pending Dispatch' });

    // --- Role Distribution ---
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const activeUsers = await User.countDocuments();

    // --- Layout Space Utilization (Volumetric) ---
    const layouts = await Layout.find({});
    const layoutStatsPromises = layouts.map(async (layout) => {
      const layoutProps = layout.properties;
      const layoutCapacity = (layoutProps?.dimensions?.w || 0) * (layoutProps?.dimensions?.d || 0) * (layoutProps?.dimensions?.h || 0);

      if (layoutCapacity === 0) {
        return { name: layout.name, utilization: 0 };
      }

      const locations = await Location.find({ layout: layout._id });
      let totalLocationsVolume = 0;
      for (const loc of locations) {
        const props = loc.properties;
        if (props && props.dimensions) {
          totalLocationsVolume += (props.dimensions.w || 0) * (props.dimensions.d || 0) * (props.dimensions.h || 0);
        }
      }

      const utilization = (totalLocationsVolume / layoutCapacity) * 100;

      return {
        name: layout.name,
        utilization: parseFloat(utilization.toFixed(2)),
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
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};