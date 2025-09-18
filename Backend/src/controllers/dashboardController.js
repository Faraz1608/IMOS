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
    const layouts = await Layout.find({}); // Find all layouts
    const layoutStatsPromises = layouts.map(async (layout) => {
      const locations = await Location.find({ layout: layout._id });
      if (locations.length === 0) {
        return { name: layout.name, utilization: 0 };
      }

      let totalLayoutCapacity = 0;
      for (const loc of locations) {
          const locProps = loc.properties;
          totalLayoutCapacity += (locProps?.dimensions?.w || 0) * (locProps?.dimensions?.d || 0) * (locProps?.dimensions?.h || 0);
      }

      if (totalLayoutCapacity === 0) {
          return { name: layout.name, utilization: 0 };
      }

      const inventoryInLayout = await Inventory.find({ location: { $in: locations.map(l => l._id) } }).populate('sku');
      
      let totalOccupiedVolume = 0;
      for (const item of inventoryInLayout) {
          const skuProps = item.sku?.properties;
          const skuVolumeCm3 = (skuProps?.dimensions?.w || 0) * (skuProps?.dimensions?.d || 0) * (skuProps?.dimensions?.h || 0);
          // Convert SKU volume from cm³ to m³ and add to total
          totalOccupiedVolume += (skuVolumeCm3 / 1000000) * item.quantity;
      }
      
      const utilization = totalLayoutCapacity > 0 ? (totalOccupiedVolume / totalLayoutCapacity) * 100 : 0;
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
      inventoryStatus 
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
