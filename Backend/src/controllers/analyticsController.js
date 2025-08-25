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