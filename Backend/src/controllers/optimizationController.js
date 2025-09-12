import Sku from '../models/Sku.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';
import InventoryMovement from '../models/InventoryMovement.js';

export const runAbcAnalysis = async (req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const movements = await InventoryMovement.aggregate([
      { $match: { createdBy: req.user._id, createdAt: { $gte: ninetyDaysAgo } } },
      { $group: { _id: '$sku', totalMovement: { $sum: '$quantity' } } },
      { $sort: { totalMovement: -1 } }
    ]);

    const totalMovementSum = movements.reduce((acc, sku) => acc + sku.totalMovement, 0);

    let cumulativePercentage = 0;
    for (const skuMovement of movements) {
      cumulativePercentage += (skuMovement.totalMovement / totalMovementSum) * 100;
      let velocity;
      if (cumulativePercentage <= 80) {
        velocity = 'A';
      } else if (cumulativePercentage <= 95) {
        velocity = 'B';
      } else {
        velocity = 'C';
      }
      await Sku.findByIdAndUpdate(skuMovement._id, { velocity });
    }

    res.status(200).json({ message: 'ABC Analysis completed successfully based on the last 90 days of movement.' });
  } catch (error) {
    console.error('Error in ABC Analysis:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getSlottingRecommendations = async (req, res) => {
  try {
    const mislocatedInventory = await Inventory.find({ createdBy: req.user.id })
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

    const occupiedLocations = await Inventory.distinct('location', { createdBy: req.user.id });
    const availableOptimalLocations = await Location.find({
      createdBy: req.user.id,
      _id: { $nin: occupiedLocations },
      locationCode: /^A01/
    });

    const recommendations = [];
    for (const item of itemsToMove) {
      const suitableLocation = availableOptimalLocations.find(loc => {
        const skuProps = item.sku.properties;
        const locProps = loc.properties;

        if (!skuProps?.dimensions || !locProps?.dimensions) return false;

        const dimsFit = (skuProps.dimensions.w <= locProps.dimensions.w * 0.95) &&
                        (skuProps.dimensions.d <= locProps.dimensions.d * 0.95) &&
                        (skuProps.dimensions.h <= locProps.dimensions.h * 0.95);

        const weightOk = (skuProps.weightKg <= locProps.weightCapacityKg);
        return dimsFit && weightOk;
      });

      if (suitableLocation) {
        recommendations.push({
          skuToMove: item.sku.skuCode,
          currentLocation: item.location.locationCode,
          recommendation: `Move to the more accessible and physically compatible location: ${suitableLocation.locationCode}.`,
          newLocationId: suitableLocation._id,
          inventoryId: item._id
        });
        const index = availableOptimalLocations.findIndex(loc => loc._id.equals(suitableLocation._id));
        if (index > -1) {
          availableOptimalLocations.splice(index, 1);
        }
      }
    }
    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error in getSlottingRecommendations:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const generatePickingRoute = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'An array of items is required.' });
    }

    const skuCodes = items.map(i => i.skuCode);
    const skus = await Sku.find({ createdBy: req.user.id, skuCode: { $in: skuCodes } }).select('_id');
    const skuIds = skus.map(s => s._id);

    const inventoryLocations = await Inventory.find({ createdBy: req.user.id, sku: { $in: skuIds } })
      .populate('location', 'locationCode');
      
    const uniqueLocations = [...new Set(inventoryLocations.map(inv => inv.location.locationCode))];
    const pickingRoute = uniqueLocations.sort();

    res.status(200).json({ pickingRoute });
  } catch (error) {
    console.error('Error generating picking route:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

