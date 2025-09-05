import Sku from '../models/Sku.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';
import Transaction from '../models/Transaction.js';
import Alert from '../models/Alert.js';
import moment from 'moment';

// @desc    Enhanced ABC Analysis based on actual transaction data
// @route   POST /api/optimize/abc-analysis
export const runAbcAnalysis = async (req, res) => {
  try {
    const { period = 90, criteria = 'value' } = req.body; // Analysis period in days
    const analysisStartDate = moment().subtract(period, 'days').toDate();
    
    // Get transaction data for the analysis period
    const transactionData = await Transaction.aggregate([
      { $match: { createdAt: { $gte: analysisStartDate } } },
      {
        $group: {
          _id: '$sku',
          totalQuantity: { $sum: '$quantity' },
          transactionCount: { $sum: 1 },
          avgQuantityPerTransaction: { $avg: '$quantity' }
        }
      },
      { $lookup: { from: 'skus', localField: '_id', foreignField: '_id', as: 'skuData' } },
      { $unwind: '$skuData' },
      {
        $project: {
          skuCode: '$skuData.skuCode',
          name: '$skuData.name',
          totalQuantity: 1,
          transactionCount: 1,
          avgQuantityPerTransaction: { $round: ['$avgQuantityPerTransaction', 2] },
          // Calculate activity score based on quantity and frequency
          activityScore: { $multiply: ['$totalQuantity', '$transactionCount'] }
        }
      },
      { $sort: { activityScore: -1 } }
    ]);
    
    if (transactionData.length === 0) {
      return res.status(400).json({ message: 'No transaction data available for ABC analysis' });
    }
    
    // Calculate cumulative percentages for classification
    const totalActivity = transactionData.reduce((sum, item) => sum + item.activityScore, 0);
    let cumulativeActivity = 0;
    
    const classificationResults = [];
    
    for (const item of transactionData) {
      cumulativeActivity += item.activityScore;
      const cumulativePercent = (cumulativeActivity / totalActivity) * 100;
      
      let classification = 'C';
      if (cumulativePercent <= 80) {
        classification = 'A';
      } else if (cumulativePercent <= 95) {
        classification = 'B';
      }
      
      // Update SKU classification in database
      await Sku.findByIdAndUpdate(item._id, { velocity: classification });
      
      classificationResults.push({
        ...item,
        classification,
        cumulativePercent: parseFloat(cumulativePercent.toFixed(2))
      });
    }
    
    // Generate alerts for reclassification recommendations
    const reclassificationAlerts = classificationResults.filter(item => {
      // Find items that might need attention based on classification change
      return item.classification === 'A' && item.transactionCount < 5; // High-value but low-frequency items
    });
    
    for (const alert of reclassificationAlerts) {
      await Alert.create({
        type: 'ABC_RECLASSIFICATION',
        priority: 'MEDIUM',
        title: 'ABC Reclassification Recommended',
        message: `SKU ${alert.skuCode} classified as 'A' but has low transaction frequency`,
        relatedEntity: {
          entityType: 'SKU',
          entityId: alert._id
        },
        details: {
          currentClassification: alert.classification,
          transactionCount: alert.transactionCount,
          totalQuantity: alert.totalQuantity
        },
        tags: ['optimization', 'abc-analysis']
      });
    }
    
    // Calculate classification distribution
    const distribution = {
      A: classificationResults.filter(item => item.classification === 'A').length,
      B: classificationResults.filter(item => item.classification === 'B').length,
      C: classificationResults.filter(item => item.classification === 'C').length
    };
    
    res.status(200).json({ 
      message: 'Enhanced ABC Analysis completed successfully.',
      analysisDetails: {
        period: `${period} days`,
        totalSKUsAnalyzed: classificationResults.length,
        distribution,
        alertsGenerated: reclassificationAlerts.length
      },
      results: classificationResults
    });
    
  } catch (error) {
    console.error('Error in Enhanced ABC Analysis:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getSlottingRecommendations = async (req, res) => {
  try {
    const optimalLocations = await Location.find({ locationCode: /^A01/ });
    if (optimalLocations.length === 0) {
      return res.status(200).json({ message: 'No optimal locations found to make recommendations.' });
    }
    const optimalLocationIds = optimalLocations.map(loc => loc._id);

    const mislocatedInventory = await Inventory.find({
      location: { $nin: optimalLocationIds }
    }).populate({
      path: 'sku',
      match: { velocity: 'A' }
    }).populate('location');

    const recommendations = mislocatedInventory
      .filter(item => item.sku)
      .map(item => ({
        skuToMove: item.sku.skuCode,
        currentLocation: item.location.locationCode,
        recommendation: `Move to an empty location in Aisle A01 for better access.`,
      }));

    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error in getSlottingRecommendations:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// --- NEW FUNCTION ---
// @desc    Generate an optimal picking route for a dispatch order
// @route   POST /api/optimize/picking-route
export const generatePickingRoute = async (req, res) => {
  try {
    const { items } = req.body; // Expect an array of { skuCode, quantity }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'An array of items is required.' });
    }

    // 1. Find the locations for all SKUs in the order.
    const inventoryLocations = await Inventory.find({
      'sku': { $in: await Sku.find({ 'skuCode': { $in: items.map(i => i.skuCode) } }).distinct('_id') }
    }).populate('location').populate('sku');

    // 2. Enhanced pathfinding algorithm considering zone optimization
    const routeWithDetails = inventoryLocations.map(inv => {
      const requestedItem = items.find(item => item.skuCode === inv.sku.skuCode);
      return {
        skuCode: inv.sku.skuCode,
        name: inv.sku.name,
        locationCode: inv.location.locationCode,
        requestedQuantity: requestedItem ? requestedItem.quantity : 0,
        availableQuantity: inv.quantity,
        zone: inv.location.locationCode.substring(0, 3), // Extract zone (e.g., A01)
        aisle: inv.location.locationCode.substring(0, 3),
        priority: inv.sku.velocity === 'A' ? 1 : inv.sku.velocity === 'B' ? 2 : 3
      };
    });

    // Sort by zone, then by priority, then alphabetically
    const optimizedRoute = routeWithDetails.sort((a, b) => {
      if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.locationCode.localeCompare(b.locationCode);
    });

    // Calculate estimated picking time (simplified algorithm)
    const estimatedTime = optimizedRoute.length * 2 + // 2 minutes per location
                         new Set(optimizedRoute.map(r => r.zone)).size * 5; // 5 minutes per zone change

    res.status(200).json({ 
      pickingRoute: optimizedRoute.map(r => r.locationCode),
      routeDetails: optimizedRoute,
      estimatedPickingTime: `${estimatedTime} minutes`,
      optimization: {
        totalLocations: optimizedRoute.length,
        zonesVisited: new Set(optimizedRoute.map(r => r.zone)).size,
        highPriorityItems: optimizedRoute.filter(r => r.priority === 1).length
      }
    });
  } catch (error) {
    console.error('Error generating picking route:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get layout optimization recommendations
// @route   GET /api/optimize/layout-optimization
export const getLayoutOptimizationRecommendations = async (req, res) => {
  try {
    const recommendations = [];
    
    // Analyze space utilization by layout
    const layouts = await Location.aggregate([
      {
        $lookup: {
          from: 'layouts',
          localField: 'layout',
          foreignField: '_id',
          as: 'layoutData'
        }
      },
      { $unwind: '$layoutData' },
      {
        $group: {
          _id: '$layout',
          layoutName: { $first: '$layoutData.name' },
          totalLocations: { $sum: 1 },
          occupiedCount: { $sum: { $cond: ['$occupied', 1, 0] } }
        }
      },
      {
        $addFields: {
          utilizationRate: { $divide: ['$occupiedCount', '$totalLocations'] },
          underutilized: { $lt: [{ $divide: ['$occupiedCount', '$totalLocations'] }, 0.6] },
          overutilized: { $gt: [{ $divide: ['$occupiedCount', '$totalLocations'] }, 0.95] }
        }
      }
    ]);
    
    // Generate recommendations based on utilization
    for (const layout of layouts) {
      if (layout.underutilized) {
        recommendations.push({
          type: 'SPACE_CONSOLIDATION',
          priority: 'MEDIUM',
          layoutId: layout._id,
          layoutName: layout.layoutName,
          message: `Layout ${layout.layoutName} is underutilized (${(layout.utilizationRate * 100).toFixed(1)}%). Consider consolidating inventory or repurposing space.`,
          metrics: {
            utilizationRate: parseFloat((layout.utilizationRate * 100).toFixed(2)),
            totalLocations: layout.totalLocations,
            occupiedLocations: layout.occupiedCount
          }
        });
      }
      
      if (layout.overutilized) {
        recommendations.push({
          type: 'CAPACITY_EXPANSION',
          priority: 'HIGH',
          layoutId: layout._id,
          layoutName: layout.layoutName,
          message: `Layout ${layout.layoutName} is at capacity (${(layout.utilizationRate * 100).toFixed(1)}%). Consider expanding or redistributing inventory.`,
          metrics: {
            utilizationRate: parseFloat((layout.utilizationRate * 100).toFixed(2)),
            totalLocations: layout.totalLocations,
            occupiedLocations: layout.occupiedCount
          }
        });
      }
    }
    
    // Analyze velocity-based positioning
    const velocityMismatches = await Inventory.aggregate([
      {
        $lookup: {
          from: 'skus',
          localField: 'sku',
          foreignField: '_id',
          as: 'skuData'
        }
      },
      { $unwind: '$skuData' },
      {
        $lookup: {
          from: 'locations',
          localField: 'location',
          foreignField: '_id',
          as: 'locationData'
        }
      },
      { $unwind: '$locationData' },
      {
        $match: {
          $and: [
            { 'skuData.velocity': 'A' },
            { 'locationData.locationCode': { $not: /^A01/ } } // A-class items not in optimal zones
          ]
        }
      },
      {
        $project: {
          skuCode: '$skuData.skuCode',
          name: '$skuData.name',
          velocity: '$skuData.velocity',
          currentLocation: '$locationData.locationCode',
          quantity: 1
        }
      },
      { $limit: 10 }
    ]);
    
    if (velocityMismatches.length > 0) {
      recommendations.push({
        type: 'VELOCITY_OPTIMIZATION',
        priority: 'HIGH',
        message: `${velocityMismatches.length} high-velocity items are not optimally positioned`,
        items: velocityMismatches,
        suggestion: 'Move A-class items to easily accessible locations (A01 zones)'
      });
    }
    
    res.status(200).json({
      recommendations,
      summary: {
        totalRecommendations: recommendations.length,
        highPriority: recommendations.filter(r => r.priority === 'HIGH').length,
        mediumPriority: recommendations.filter(r => r.priority === 'MEDIUM').length
      }
    });
    
  } catch (error) {
    console.error('Error getting layout optimization recommendations:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Calculate reorder points and safety stock levels
// @route   POST /api/optimize/reorder-analysis
export const calculateReorderPoints = async (req, res) => {
  try {
    const { leadTimeDays = 7, serviceLevel = 0.95 } = req.body;
    
    // Get historical demand data for all SKUs
    const demandAnalysis = await Transaction.aggregate([
      {
        $match: {
          type: 'GI', // Only consider goods issues (outbound)
          createdAt: { $gte: moment().subtract(180, 'days').toDate() } // Last 6 months
        }
      },
      {
        $group: {
          _id: {
            sku: '$sku',
            week: { $week: '$createdAt' }
          },
          weeklyDemand: { $sum: '$quantity' }
        }
      },
      {
        $group: {
          _id: '$_id.sku',
          demands: { $push: '$weeklyDemand' },
          avgWeeklyDemand: { $avg: '$weeklyDemand' },
          totalWeeks: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'skus',
          localField: '_id',
          foreignField: '_id',
          as: 'skuData'
        }
      },
      { $unwind: '$skuData' },
      {
        $lookup: {
          from: 'inventories',
          localField: '_id',
          foreignField: 'sku',
          as: 'inventoryData'
        }
      },
      {
        $project: {
          skuCode: '$skuData.skuCode',
          name: '$skuData.name',
          velocity: '$skuData.velocity',
          avgWeeklyDemand: { $round: ['$avgWeeklyDemand', 2] },
          avgDailyDemand: { $round: [{ $divide: ['$avgWeeklyDemand', 7] }, 2] },
          currentStock: { $sum: '$inventoryData.quantity' },
          demands: 1,
          totalWeeks: 1
        }
      }
    ]);
    
    const reorderPoints = [];
    
    for (const item of demandAnalysis) {
      if (item.avgDailyDemand > 0) {
        // Calculate demand variability (standard deviation)
        const mean = item.avgWeeklyDemand;
        const variance = item.demands.reduce((acc, demand) => {
          return acc + Math.pow(demand - mean, 2);
        }, 0) / item.demands.length;
        const stdDev = Math.sqrt(variance);
        
        // Z-score for service level (95% = 1.645, 99% = 2.33)
        const zScore = serviceLevel >= 0.99 ? 2.33 : serviceLevel >= 0.95 ? 1.645 : 1.28;
        
        // Calculate reorder point and safety stock
        const leadTimeDemand = item.avgDailyDemand * leadTimeDays;
        const safetyStock = Math.ceil(zScore * (stdDev / Math.sqrt(7)) * Math.sqrt(leadTimeDays));
        const reorderPoint = Math.ceil(leadTimeDemand + safetyStock);
        const maxStock = Math.ceil(reorderPoint * 2); // Simple max stock calculation
        
        reorderPoints.push({
          ...item,
          leadTimeDays,
          serviceLevel: serviceLevel * 100,
          leadTimeDemand: parseFloat(leadTimeDemand.toFixed(2)),
          safetyStock,
          reorderPoint,
          maxStock,
          demandVariability: parseFloat(stdDev.toFixed(2)),
          recommendedAction: item.currentStock <= reorderPoint ? 'REORDER_NOW' : 
                           item.currentStock >= maxStock ? 'EXCESS_STOCK' : 'NORMAL',
          daysOfStock: item.avgDailyDemand > 0 ? Math.floor(item.currentStock / item.avgDailyDemand) : 999
        });
      }
    }
    
    // Generate alerts for items that need reordering
    const reorderAlerts = reorderPoints.filter(item => item.recommendedAction === 'REORDER_NOW');
    
    for (const alert of reorderAlerts.slice(0, 10)) { // Limit to 10 alerts
      await Alert.create({
        type: 'LOW_STOCK',
        priority: alert.daysOfStock <= 3 ? 'CRITICAL' : 'HIGH',
        title: 'Reorder Point Reached',
        message: `SKU ${alert.skuCode} has reached reorder point (Current: ${alert.currentStock}, Reorder at: ${alert.reorderPoint})`,
        relatedEntity: {
          entityType: 'SKU',
          entityId: alert._id
        },
        details: {
          currentStock: alert.currentStock,
          reorderPoint: alert.reorderPoint,
          daysOfStock: alert.daysOfStock,
          avgDailyDemand: alert.avgDailyDemand
        },
        tags: ['inventory', 'reorder', 'stock-management']
      });
    }
    
    res.status(200).json({
      message: 'Reorder point analysis completed',
      parameters: {
        leadTimeDays,
        serviceLevel: serviceLevel * 100 + '%',
        analysisBasedOn: '180 days of historical data'
      },
      summary: {
        totalSKUs: reorderPoints.length,
        needReorder: reorderPoints.filter(r => r.recommendedAction === 'REORDER_NOW').length,
        excessStock: reorderPoints.filter(r => r.recommendedAction === 'EXCESS_STOCK').length,
        alertsGenerated: reorderAlerts.length
      },
      reorderPoints: reorderPoints.sort((a, b) => a.daysOfStock - b.daysOfStock)
    });
    
  } catch (error) {
    console.error('Error calculating reorder points:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
