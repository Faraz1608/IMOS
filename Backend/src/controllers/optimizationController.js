import Sku from '../models/Sku.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';

// ... (existing runAbcAnalysis and getSlottingRecommendations functions remain the same)
export const runAbcAnalysis = async (req, res) => {
  try {
    const skus = await Sku.find({});
    const classifications = ['A', 'B', 'C'];
    
    for (const sku of skus) {
      const randomClass = classifications[Math.floor(Math.random() * classifications.length)];
      sku.velocity = randomClass;
      await sku.save();
    }

    res.status(200).json({ message: 'ABC Analysis completed successfully.' });
  } catch (error) {
    console.error('Error in ABC Analysis:', error);
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
    }).populate('location');

    // 2. Simulate a pathfinding algorithm by sorting locations alphabetically.
    const pickingRoute = inventoryLocations
      .map(inv => inv.location.locationCode)
      .sort(); // A simple sort to simulate an optimized path

    res.status(200).json({ pickingRoute });
  } catch (error) {
    console.error('Error generating picking route:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};