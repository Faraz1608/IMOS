import Inventory from '../models/Inventory.js';

// @desc    Get inventory aging report
// @route   GET /api/analytics/aging-report
export const getAgingReport = async (req, res) => {
  try {
    const today = new Date();
    const agingData = await Inventory.aggregate([
      {
        $project: {
          sku: 1,
          quantity: 1,
          ageInDays: {
            $divide: [
              { $subtract: [today, '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert milliseconds to days
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'skus', // The actual name of the SKUs collection in MongoDB
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
      { $sort: { ageInDays: -1 } } // Sort by oldest first
    ]);
    res.status(200).json(agingData);
  } catch (error) {
    console.error('Error fetching aging report:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
export const getDemandForecast = async (req, res) => {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Aggregate sales data (Goods Issues) from the last 90 days
        const salesData = await InventoryMovement.aggregate([
            {
                $match: {
                    type: 'GI', // Only count Goods Issues as sales
                    createdAt: { $gte: ninetyDaysAgo }
                }
            },
            {
                $group: {
                    _id: '$sku',
                    totalSold: { $sum: '$quantity' }
                }
            },
            {
                $lookup: {
                    from: 'skus',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'skuDetails'
                }
            },
            { $unwind: '$skuDetails' }
        ]);

        const forecast = salesData.map(item => {
            // Simple Moving Average: Total sold / number of periods (in this case, 3 months)
            const monthlyAverage = item.totalSold / 3;
            return {
                skuId: item._id,
                skuCode: item.skuDetails.skuCode,
                skuName: item.skuDetails.name,
                last90DaysSales: item.totalSold,
                forecastedMonthlyDemand: Math.ceil(monthlyAverage),
            };
        });

        // Sort by the highest demand forecast
        forecast.sort((a, b) => b.forecastedMonthlyDemand - a.forecastedMonthlyDemand);

        res.status(200).json(forecast);
    } catch (error) {
        console.error('Error fetching demand forecast:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};