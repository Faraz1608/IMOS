import Sku from '../models/Sku.js';
import Dispatch from '../models/Dispatch.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Layout from '../models/Layout.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';
import moment from 'moment';

// @desc    Get all dashboard statistics
// @route   GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    // --- Enhanced KPI Stats ---
    const totalSkus = await Sku.countDocuments();
    const pendingDispatches = await Dispatch.countDocuments({ status: 'Pending Dispatch' });
    const totalInventoryValue = await getInventoryValue();
    const lowStockAlerts = await getLowStockCount();
    
    // --- Role Distribution ---
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const activeUsers = userRoles.reduce((acc, role) => acc + role.count, 0);

    // --- Enhanced Layout Space Utilization ---
    const layouts = await Layout.find({ createdBy: req.user.id });
    const layoutStatsPromises = layouts.map(async (layout) => {
      const totalLocations = await Location.countDocuments({ layout: layout._id });
      const occupiedLocationsResult = await Inventory.distinct('location', { 
          location: { $in: await Location.find({ layout: layout._id }).distinct('_id') } 
      });
      const spaceUtilization = totalLocations > 0 ? (occupiedLocationsResult.length / totalLocations) * 100 : 0;
      
      // Calculate total inventory in this layout
      const layoutInventory = await Inventory.aggregate([
        { $lookup: { from: 'locations', localField: 'location', foreignField: '_id', as: 'locationData' } },
        { $match: { 'locationData.layout': layout._id } },
        { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } }
      ]);
      
      return {
        name: layout.name,
        utilization: parseFloat(spaceUtilization.toFixed(2)),
        totalItems: layoutInventory[0]?.totalQuantity || 0,
        totalLocations,
        occupiedLocations: occupiedLocationsResult.length
      };
    });
    const layoutUtilization = await Promise.all(layoutStatsPromises);

    // --- Transaction Trends (Last 7 days) ---
    const transactionTrends = await getTransactionTrends();
    
    // --- Recent Transactions ---
    const recentTransactions = await Transaction.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // --- Inventory Status (Recent Dispatches) ---
    const inventoryStatus = await Dispatch.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('items.sku', 'name skuCode')
        .populate('approvedBy', 'username');

    // --- SKU Velocity Analysis ---
    const velocityAnalysis = await Sku.aggregate([
      { $group: { _id: '$velocity', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // --- Top Moving SKUs ---
    const topMovingSKUs = await getTopMovingSKUs();

    // --- Monthly Transaction Volume ---
    const monthlyVolume = await getMonthlyTransactionVolume();

    res.status(200).json({
      totalSkus,
      pendingDispatches,
      activeUsers,
      totalInventoryValue,
      lowStockAlerts,
      userRoles,
      layoutUtilization,
      recentTransactions,
      inventoryStatus,
      transactionTrends,
      velocityAnalysis,
      topMovingSKUs,
      monthlyVolume
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Helper function to calculate total inventory value
const getInventoryValue = async () => {
  try {
    const inventoryWithSKU = await Inventory.aggregate([
      { $lookup: { from: 'skus', localField: 'sku', foreignField: '_id', as: 'skuData' } },
      { $unwind: '$skuData' },
      { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } }
    ]);
    return inventoryWithSKU[0]?.totalQuantity || 0;
  } catch (error) {
    console.error('Error calculating inventory value:', error);
    return 0;
  }
};

// Helper function to get low stock count
const getLowStockCount = async () => {
  try {
    const lowStockThreshold = 10; // Define your low stock threshold
    return await Inventory.countDocuments({ quantity: { $lte: lowStockThreshold } });
  } catch (error) {
    console.error('Error getting low stock count:', error);
    return 0;
  }
};

// Helper function to get transaction trends
const getTransactionTrends = async () => {
  try {
    const last7Days = moment().subtract(7, 'days').toDate();
    
    return await Transaction.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: '$type'
          },
          count: { $sum: 1 },
          quantity: { $sum: '$quantity' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          transactions: {
            $push: {
              type: '$_id.type',
              count: '$count',
              quantity: '$quantity'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  } catch (error) {
    console.error('Error getting transaction trends:', error);
    return [];
  }
};

// Helper function to get top moving SKUs
const getTopMovingSKUs = async () => {
  try {
    const last30Days = moment().subtract(30, 'days').toDate();
    
    return await Transaction.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      { $group: { _id: '$sku', totalMovement: { $sum: '$quantity' } } },
      { $lookup: { from: 'skus', localField: '_id', foreignField: '_id', as: 'skuData' } },
      { $unwind: '$skuData' },
      {
        $project: {
          skuCode: '$skuData.skuCode',
          name: '$skuData.name',
          velocity: '$skuData.velocity',
          totalMovement: 1
        }
      },
      { $sort: { totalMovement: -1 } },
      { $limit: 10 }
    ]);
  } catch (error) {
    console.error('Error getting top moving SKUs:', error);
    return [];
  }
};

// Helper function to get monthly transaction volume
const getMonthlyTransactionVolume = async () => {
  try {
    const last6Months = moment().subtract(6, 'months').toDate();
    
    return await Transaction.aggregate([
      { $match: { createdAt: { $gte: last6Months } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $project: {
          _id: 0,
          month: {
            $dateFromString: {
              dateString: {
                $concat: [
                  { $toString: '$_id.year' },
                  '-',
                  { $toString: '$_id.month' },
                  '-01'
                ]
              }
            }
          },
          count: 1,
          totalQuantity: 1
        }
      },
      { $sort: { month: 1 } }
    ]);
  } catch (error) {
    console.error('Error getting monthly transaction volume:', error);
    return [];
  }
};
