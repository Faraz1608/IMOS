import Sku from '../models/Sku.js';
import Dispatch from '../models/Dispatch.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Layout from '../models/Layout.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';

/**
 * @desc   Fetch overall dashboard statistics (KPIs, roles, utilization, recent activity)
 * @route  GET /api/dashboard/stats
 * @access Protected
 */
export const getDashboardStats = async (req, res) => {
  try {
    const totalSkus = await Sku.countDocuments();
    const pendingDispatches = await Dispatch.countDocuments({ status: 'Pending Dispatch' });
    
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const activeUsers = await User.countDocuments();

    // Calculate volumetric space utilization for each layout
    const layouts = await Layout.find({}); 
    const layoutStatsPromises = layouts.map(async (layout) => {
      const locations = await Location.find({ layout: layout._id });
      if (locations.length === 0) {
        return { name: layout.name, utilization: 0 };
      }

      let totalLayoutCapacity = 0;
      for (const loc of locations) {
        const locProps = loc.properties;
        totalLayoutCapacity += (locProps?.dimensions?.w || 0) * 
                               (locProps?.dimensions?.d || 0) * 
                               (locProps?.dimensions?.h || 0);
      }

      if (totalLayoutCapacity === 0) {
        return { name: layout.name, utilization: 0 };
      }

      const inventoryInLayout = await Inventory.find({
        location: { $in: locations.map(l => l._id) }
      }).populate('sku');
      
      let totalOccupiedVolume = 0;
      for (const item of inventoryInLayout) {
        const skuProps = item.sku?.properties;
        const skuVolume = (skuProps?.dimensions?.w || 0) * 
                          (skuProps?.dimensions?.d || 0) * 
                          (skuProps?.dimensions?.h || 0);
        totalOccupiedVolume += skuVolume * item.quantity;
      }
      
      const utilization = (totalOccupiedVolume / totalLayoutCapacity) * 100;
      return {
        name: layout.name,
        utilization: parseFloat(utilization.toFixed(2)),
      };
    });
    const layoutUtilization = await Promise.all(layoutStatsPromises);

    const recentTransactions = await Transaction.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

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
