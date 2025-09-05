import Sku from '../models/Sku.js';
import Transaction from '../models/Transaction.js';
import Inventory from '../models/Inventory.js';
import Layout from '../models/Layout.js';
import Location from '../models/Location.js';
import moment from 'moment';

// @desc    Get predictive analytics data
// @route   GET /api/analytics/predictive
export const getPredictiveAnalytics = async (req, res) => {
  try {
    const demandForecast = await getDemandForecast();
    const seasonalAnalysis = await getSeasonalAnalysis();
    const abcAnalysisData = await getABCAnalysisData();
    const stockoutPrediction = await getStockoutPrediction();
    
    res.status(200).json({
      demandForecast,
      seasonalAnalysis,
      abcAnalysisData,
      stockoutPrediction
    });
  } catch (error) {
    console.error('Error fetching predictive analytics:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get inventory turnover analysis
// @route   GET /api/analytics/turnover
export const getInventoryTurnoverAnalysis = async (req, res) => {
  try {
    const turnoverData = await calculateInventoryTurnover();
    const slowMovingItems = await getSlowMovingItems();
    const fastMovingItems = await getFastMovingItems();
    
    res.status(200).json({
      turnoverData,
      slowMovingItems,
      fastMovingItems
    });
  } catch (error) {
    console.error('Error fetching turnover analysis:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get space utilization analysis
// @route   GET /api/analytics/space-utilization
export const getSpaceUtilizationAnalysis = async (req, res) => {
  try {
    const utilizationTrends = await getUtilizationTrends();
    const capacityAnalysis = await getCapacityAnalysis();
    const hotspotAnalysis = await getStorageHotspots();
    
    res.status(200).json({
      utilizationTrends,
      capacityAnalysis,
      hotspotAnalysis
    });
  } catch (error) {
    console.error('Error fetching space utilization analysis:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get cost analysis data
// @route   GET /api/analytics/cost-analysis
export const getCostAnalysis = async (req, res) => {
  try {
    const carryingCosts = await getCarryingCosts();
    const costTrends = await getCostTrends();
    const costByCategory = await getCostByCategory();
    
    res.status(200).json({
      carryingCosts,
      costTrends,
      costByCategory
    });
  } catch (error) {
    console.error('Error fetching cost analysis:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Export analytics data
// @route   POST /api/analytics/export
export const exportAnalyticsData = async (req, res) => {
  try {
    const { reportType, dateRange, format } = req.body;
    
    let data = {};
    switch (reportType) {
      case 'inventory':
        data = await getInventoryReport(dateRange);
        break;
      case 'transactions':
        data = await getTransactionReport(dateRange);
        break;
      case 'utilization':
        data = await getUtilizationReport(dateRange);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }
    
    // Format data based on requested format (JSON, CSV, etc.)
    const formattedData = formatReportData(data, format);
    
    res.status(200).json({
      data: formattedData,
      exportDate: new Date(),
      reportType,
      dateRange
    });
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Helper Functions

// Demand forecasting using simple moving average
const getDemandForecast = async () => {
  try {
    const last90Days = moment().subtract(90, 'days').toDate();
    
    const demandData = await Transaction.aggregate([
      { $match: { createdAt: { $gte: last90Days }, type: 'GI' } },
      {
        $group: {
          _id: {
            sku: '$sku',
            week: { $week: '$createdAt' }
          },
          totalDemand: { $sum: '$quantity' }
        }
      },
      { $lookup: { from: 'skus', localField: '_id.sku', foreignField: '_id', as: 'skuData' } },
      { $unwind: '$skuData' },
      {
        $group: {
          _id: '$_id.sku',
          skuCode: { $first: '$skuData.skuCode' },
          name: { $first: '$skuData.name' },
          velocity: { $first: '$skuData.velocity' },
          weeklyDemand: { $push: '$totalDemand' },
          avgWeeklyDemand: { $avg: '$totalDemand' }
        }
      },
      {
        $project: {
          skuCode: 1,
          name: 1,
          velocity: 1,
          avgWeeklyDemand: { $round: ['$avgWeeklyDemand', 2] },
          forecastedDemand: { $round: [{ $multiply: ['$avgWeeklyDemand', 4] }, 0] }, // 4 weeks forecast
          confidence: {
            $cond: {
              if: { $gte: [{ $size: '$weeklyDemand' }, 8] },
              then: 'High',
              else: { $cond: { if: { $gte: [{ $size: '$weeklyDemand' }, 4] }, then: 'Medium', else: 'Low' } }
            }
          }
        }
      },
      { $sort: { forecastedDemand: -1 } },
      { $limit: 20 }
    ]);
    
    return demandData;
  } catch (error) {
    console.error('Error calculating demand forecast:', error);
    return [];
  }
};

// Seasonal analysis
const getSeasonalAnalysis = async () => {
  try {
    const lastYear = moment().subtract(1, 'year').toDate();
    
    return await Transaction.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            type: '$type'
          },
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.month',
          transactions: {
            $push: {
              type: '$_id.type',
              quantity: '$totalQuantity',
              count: '$count'
            }
          },
          totalActivity: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  } catch (error) {
    console.error('Error calculating seasonal analysis:', error);
    return [];
  }
};

// Enhanced ABC Analysis
const getABCAnalysisData = async () => {
  try {
    const last90Days = moment().subtract(90, 'days').toDate();
    
    const abcData = await Transaction.aggregate([
      { $match: { createdAt: { $gte: last90Days } } },
      {
        $group: {
          _id: '$sku',
          totalMovement: { $sum: '$quantity' },
          transactionCount: { $sum: 1 }
        }
      },
      { $lookup: { from: 'skus', localField: '_id', foreignField: '_id', as: 'skuData' } },
      { $unwind: '$skuData' },
      { $lookup: { from: 'inventories', localField: '_id', foreignField: 'sku', as: 'inventoryData' } },
      {
        $project: {
          skuCode: '$skuData.skuCode',
          name: '$skuData.name',
          currentVelocity: '$skuData.velocity',
          totalMovement: 1,
          transactionCount: 1,
          currentStock: { $sum: '$inventoryData.quantity' },
          movementScore: { $multiply: ['$totalMovement', '$transactionCount'] }
        }
      },
      { $sort: { movementScore: -1 } }
    ]);
    
    // Calculate ABC classification thresholds
    const totalScore = abcData.reduce((sum, item) => sum + item.movementScore, 0);
    let cumulativeScore = 0;
    
    const classifiedData = abcData.map((item, index) => {
      cumulativeScore += item.movementScore;
      const cumulativePercent = (cumulativeScore / totalScore) * 100;
      
      let suggestedClass = 'C';
      if (cumulativePercent <= 80) suggestedClass = 'A';
      else if (cumulativePercent <= 95) suggestedClass = 'B';
      
      return {
        ...item,
        cumulativePercent: parseFloat(cumulativePercent.toFixed(2)),
        suggestedClass,
        currentClass: item.currentVelocity,
        needsReclassification: suggestedClass !== item.currentVelocity
      };
    });
    
    return classifiedData;
  } catch (error) {
    console.error('Error calculating ABC analysis:', error);
    return [];
  }
};

// Stockout prediction
const getStockoutPrediction = async () => {
  try {
    const last30Days = moment().subtract(30, 'days').toDate();
    
    const riskAnalysis = await Inventory.aggregate([
      { $lookup: { from: 'skus', localField: 'sku', foreignField: '_id', as: 'skuData' } },
      { $unwind: '$skuData' },
      {
        $lookup: {
          from: 'transactions',
          let: { skuId: '$sku' },
          pipeline: [
            { $match: { $expr: { $eq: ['$sku', '$$skuId'] }, createdAt: { $gte: last30Days }, type: 'GI' } },
            { $group: { _id: null, avgDailyUsage: { $avg: '$quantity' }, totalUsage: { $sum: '$quantity' } } }
          ],
          as: 'usageData'
        }
      },
      {
        $project: {
          skuCode: '$skuData.skuCode',
          name: '$skuData.name',
          currentStock: '$quantity',
          velocity: '$skuData.velocity',
          avgDailyUsage: { $ifNull: [{ $arrayElemAt: ['$usageData.avgDailyUsage', 0] }, 0] },
          daysToStockout: {
            $cond: {
              if: { $gt: [{ $arrayElemAt: ['$usageData.avgDailyUsage', 0] }, 0] },
              then: { $divide: ['$quantity', { $arrayElemAt: ['$usageData.avgDailyUsage', 0] }] },
              else: 999
            }
          }
        }
      },
      {
        $addFields: {
          riskLevel: {
            $cond: {
              if: { $lte: ['$daysToStockout', 7] },
              then: 'Critical',
              else: {
                $cond: {
                  if: { $lte: ['$daysToStockout', 14] },
                  then: 'High',
                  else: {
                    $cond: {
                      if: { $lte: ['$daysToStockout', 30] },
                      then: 'Medium',
                      else: 'Low'
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $match: { daysToStockout: { $lt: 30 } } },
      { $sort: { daysToStockout: 1 } }
    ]);
    
    return riskAnalysis;
  } catch (error) {
    console.error('Error calculating stockout prediction:', error);
    return [];
  }
};

// Calculate inventory turnover
const calculateInventoryTurnover = async () => {
  try {
    const last12Months = moment().subtract(12, 'months').toDate();
    
    return await Inventory.aggregate([
      { $lookup: { from: 'skus', localField: 'sku', foreignField: '_id', as: 'skuData' } },
      { $unwind: '$skuData' },
      {
        $lookup: {
          from: 'transactions',
          let: { skuId: '$sku' },
          pipeline: [
            { $match: { $expr: { $eq: ['$sku', '$$skuId'] }, createdAt: { $gte: last12Months }, type: 'GI' } },
            { $group: { _id: null, totalIssued: { $sum: '$quantity' } } }
          ],
          as: 'issuanceData'
        }
      },
      {
        $project: {
          skuCode: '$skuData.skuCode',
          name: '$skuData.name',
          currentStock: '$quantity',
          annualIssued: { $ifNull: [{ $arrayElemAt: ['$issuanceData.totalIssued', 0] }, 0] },
          turnoverRatio: {
            $cond: {
              if: { $gt: ['$quantity', 0] },
              then: { $divide: [{ $ifNull: [{ $arrayElemAt: ['$issuanceData.totalIssued', 0] }, 0] }, '$quantity'] },
              else: 0
            }
          }
        }
      },
      {
        $addFields: {
          turnoverCategory: {
            $cond: {
              if: { $gte: ['$turnoverRatio', 12] },
              then: 'Fast',
              else: {
                $cond: {
                  if: { $gte: ['$turnoverRatio', 4] },
                  then: 'Medium',
                  else: 'Slow'
                }
              }
            }
          }
        }
      },
      { $sort: { turnoverRatio: -1 } }
    ]);
  } catch (error) {
    console.error('Error calculating inventory turnover:', error);
    return [];
  }
};

// Get slow moving items
const getSlowMovingItems = async () => {
  try {
    const last90Days = moment().subtract(90, 'days').toDate();
    
    return await Inventory.aggregate([
      { $lookup: { from: 'skus', localField: 'sku', foreignField: '_id', as: 'skuData' } },
      { $unwind: '$skuData' },
      {
        $lookup: {
          from: 'transactions',
          let: { skuId: '$sku' },
          pipeline: [
            { $match: { $expr: { $eq: ['$sku', '$$skuId'] }, createdAt: { $gte: last90Days } } },
            { $count: 'transactionCount' }
          ],
          as: 'recentActivity'
        }
      },
      {
        $match: {
          $or: [
            { recentActivity: { $size: 0 } },
            { 'recentActivity.transactionCount': { $lte: 2 } }
          ]
        }
      },
      {
        $project: {
          skuCode: '$skuData.skuCode',
          name: '$skuData.name',
          currentStock: '$quantity',
          velocity: '$skuData.velocity',
          recentTransactions: { $ifNull: [{ $arrayElemAt: ['$recentActivity.transactionCount', 0] }, 0] },
          lastActivity: '$updatedAt'
        }
      },
      { $sort: { recentTransactions: 1, lastActivity: 1 } },
      { $limit: 20 }
    ]);
  } catch (error) {
    console.error('Error getting slow moving items:', error);
    return [];
  }
};

// Get fast moving items
const getFastMovingItems = async () => {
  try {
    const last30Days = moment().subtract(30, 'days').toDate();
    
    return await Transaction.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: '$sku',
          totalMovement: { $sum: '$quantity' },
          transactionCount: { $sum: 1 }
        }
      },
      { $lookup: { from: 'skus', localField: '_id', foreignField: '_id', as: 'skuData' } },
      { $unwind: '$skuData' },
      { $lookup: { from: 'inventories', localField: '_id', foreignField: 'sku', as: 'inventoryData' } },
      {
        $project: {
          skuCode: '$skuData.skuCode',
          name: '$skuData.name',
          velocity: '$skuData.velocity',
          totalMovement: 1,
          transactionCount: 1,
          currentStock: { $sum: '$inventoryData.quantity' },
          dailyAverage: { $divide: ['$totalMovement', 30] }
        }
      },
      { $sort: { totalMovement: -1 } },
      { $limit: 20 }
    ]);
  } catch (error) {
    console.error('Error getting fast moving items:', error);
    return [];
  }
};

// Additional helper functions for other analytics features...
const getUtilizationTrends = async () => {
  // Implementation for utilization trends
  return [];
};

const getCapacityAnalysis = async () => {
  // Implementation for capacity analysis
  return [];
};

const getStorageHotspots = async () => {
  // Implementation for storage hotspots
  return [];
};

const getCarryingCosts = async () => {
  // Implementation for carrying costs
  return [];
};

const getCostTrends = async () => {
  // Implementation for cost trends
  return [];
};

const getCostByCategory = async () => {
  // Implementation for cost by category
  return [];
};

const getInventoryReport = async (dateRange) => {
  // Implementation for inventory report
  return {};
};

const getTransactionReport = async (dateRange) => {
  // Implementation for transaction report
  return {};
};

const getUtilizationReport = async (dateRange) => {
  // Implementation for utilization report
  return {};
};

const formatReportData = (data, format) => {
  // Implementation for data formatting
  return data;
};
