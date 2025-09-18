import Inventory from '../models/Inventory.js';
// Note: Make sure InventoryMovement model is imported for demand forecast

/**
 * @desc   Generate inventory aging report
 * @route  GET /api/analytics/aging-report
 * @access Protected
 */
export const getAgingReport = async (req, res) => {
  try {
    const today = new Date();

    const agingData = await Inventory.aggregate([
      {
        // Calculate item age in days from createdAt
        $project: {
          sku: 1,
          quantity: 1,
          ageInDays: {
            $divide: [
              { $subtract: [today, '$createdAt'] },
              1000 * 60 * 60 * 24 // ms → days
            ]
          }
        }
      },
      {
        // Join with SKU collection for details
        $lookup: {
          from: 'skus',
          localField: 'sku',
          foreignField: '_id',
          as: 'skuDetails'
        }
      },
      { $unwind: '$skuDetails' },
      {
        $project: {
          skuCode: '$skuDetails.skuCode',
          quantity: '$quantity',
          ageInDays: { $round: ['$ageInDays', 0] }
        }
      },
      { $sort: { ageInDays: -1 } } // Show oldest first
    ]);

    res.status(200).json(agingData);
  } catch (error) {
    console.error('Error fetching aging report:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc   Generate demand forecast based on last 90 days sales (Goods Issue)
 * @route  GET /api/analytics/demand-forecast
 * @access Protected
 */
export const getDemandForecast = async (req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const salesData = await InventoryMovement.aggregate([
      {
        // Filter only "Goods Issue" movements from last 90 days
        $match: {
          type: 'GI',
          createdAt: { $gte: ninetyDaysAgo }
        }
      },
      {
        // Group by SKU and sum quantities
        $group: {
          _id: '$sku',
          totalSold: { $sum: '$quantity' }
        }
      },
      {
        // Join with SKU details
        $lookup: {
          from: 'skus',
          localField: '_id',
          foreignField: '_id',
          as: 'skuDetails'
        }
      },
      { $unwind: '$skuDetails' }
    ]);

    // Calculate monthly average demand forecast
    const forecast = salesData.map(item => {
      const monthlyAverage = item.totalSold / 3; // 90 days ≈ 3 months
      return {
        skuId: item._id,
        skuCode: item.skuDetails.skuCode,
        skuName: item.skuDetails.name,
        last90DaysSales: item.totalSold,
        forecastedMonthlyDemand: Math.ceil(monthlyAverage),
      };
    });

    // Sort by highest demand forecast
    forecast.sort((a, b) => b.forecastedMonthlyDemand - a.forecastedMonthlyDemand);

    res.status(200).json(forecast);
  } catch (error) {
    console.error('Error fetching demand forecast:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
