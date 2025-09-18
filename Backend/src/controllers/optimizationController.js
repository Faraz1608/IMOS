import Sku from '../models/Sku.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';
import InventoryMovement from '../models/InventoryMovement.js';

// @desc    Run ABC velocity analysis on SKUs (based on last 90 days movement)
// @route   POST /api/analytics/abc-analysis
export const runAbcAnalysis = async (req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Aggregate total movements per SKU in last 90 days
    const movements = await InventoryMovement.aggregate([
      { $match: { createdAt: { $gte: ninetyDaysAgo } } },
      { $group: { _id: '$sku', totalMovement: { $sum: '$quantity' } } },
      { $sort: { totalMovement: -1 } }
    ]);

    if (movements.length === 0) {
      return res.status(200).json({
        message: 'No inventory movements found in the last 90 days to analyze.'
      });
    }

    const totalMovementSum = movements.reduce((acc, sku) => acc + sku.totalMovement, 0);

    // Assign velocity classes based on cumulative contribution
    let cumulativePercentage = 0;
    for (const skuMovement of movements) {
      cumulativePercentage += (skuMovement.totalMovement / totalMovementSum) * 100;
      let velocity;
      if (cumulativePercentage <= 80) {
        velocity = 'A'; // High movers
      } else if (cumulativePercentage <= 95) {
        velocity = 'B'; // Medium movers
      } else {
        velocity = 'C'; // Low movers
      }
      await Sku.findByIdAndUpdate(skuMovement._id, { velocity });
    }

    // Any SKU with no movement → C
    const movedSkuIds = movements.map(m => m._id);
    await Sku.updateMany({ _id: { $nin: movedSkuIds } }, { velocity: 'C' });

    res.status(200).json({
      message: 'ABC Analysis completed successfully based on the last 90 days of movement.'
    });
  } catch (error) {
    console.error('Error in ABC Analysis:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get slotting recommendations (misplaced A items)
// @route   GET /api/analytics/slotting
export const getSlottingRecommendations = async (req, res) => {
  try {
    // Find inventory where A-class SKUs are not in priority locations (A01 range)
    const mislocatedInventory = await Inventory.find()
      .populate({
        path: 'sku',
        match: { velocity: 'A' },
        select: 'skuCode name properties velocity'
      })
      .populate({
        path: 'location',
        match: { locationCode: { $not: /^A01/ } },
        select: 'locationCode properties'
      });

    const itemsToMove = mislocatedInventory.filter(item => item.sku && item.location);

    if (itemsToMove.length === 0) {
      return res.status(200).json([]); 
    }

    // Find optimal available locations in A01
    const occupiedLocations = await Inventory.distinct('location');
    const availableOptimalLocations = await Location.find({
      _id: { $nin: occupiedLocations },
      locationCode: /^A01/
    });

    const recommendations = [];
    for (const item of itemsToMove) {
      // Check if dimensions & weight fit in target location
      const suitableLocation = availableOptimalLocations.find(loc => {
        const skuProps = item.sku.properties;
        const locProps = loc.properties;
        const dimsFit = (skuProps?.dimensions?.w <= locProps?.dimensions?.w * 0.95) &&
                        (skuProps?.dimensions?.d <= locProps?.dimensions?.d * 0.95) &&
                        (skuProps?.dimensions?.h <= locProps?.dimensions?.h * 0.95);
        const weightOk = (skuProps?.weightKg <= locProps?.weightCapacityKg);
        return dimsFit && weightOk;
      });

      if (suitableLocation) {
        recommendations.push({
          skuToMove: item.sku.skuCode,
          currentLocation: item.location.locationCode,
          recommendation: `Move to optimal location: ${suitableLocation.locationCode}.`,
          newLocationId: suitableLocation._id,
          inventoryId: item._id
        });
        // Reserve the location for one item
        const index = availableOptimalLocations.findIndex(loc => loc._id.equals(suitableLocation._id));
        availableOptimalLocations.splice(index, 1);
      }
    }

    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error in getSlottingRecommendations:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Generate warehouse picking route (sorted by location code)
// @route   POST /api/analytics/picking-route
export const generatePickingRoute = async (req, res) => {
  try {
    const { items } = req.body; 

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'An array of items is required.' });
    }

    // Find inventory locations for requested SKUs
    const inventoryLocations = await Inventory.find({
      'sku': { $in: await Sku.find({ 'skuCode': { $in: items.map(i => i.skuCode) } }).distinct('_id') }
    }).populate('location');

    // Simplified: picking route = sorted location codes
    const pickingRoute = inventoryLocations
      .map(inv => inv.location.locationCode)
      .sort();

    res.status(200).json({ pickingRoute });
  } catch (error) {
    console.error('Error generating picking route:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
