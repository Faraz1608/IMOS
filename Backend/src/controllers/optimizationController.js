import Sku from '../models/Sku.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';

// @desc    Run ABC analysis on all SKUs
// @route   POST /api/optimize/abc-analysis
export const runAbcAnalysis = async (req, res) => {
  try {
    // In a real system, you'd pull sales/movement data.
    // Here, we'll simulate it with a simple placeholder logic.
    // For this example, we'll randomly assign A, B, or C.
    
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

// @desc    Generate slotting recommendations
// @route   GET /api/optimize/recommendations
export const getSlottingRecommendations = async (req, res) => {
  try {
    // 1. Define what an "optimal" location is.
    // For this example, let's say it's any location in aisle "A01".
    const optimalLocations = await Location.find({ locationCode: /^A01/ });
    if (optimalLocations.length === 0) {
      return res.status(200).json({ message: 'No optimal locations found to make recommendations.' });
    }
    const optimalLocationIds = optimalLocations.map(loc => loc._id);

    // 2. Find fast-moving ('A' class) SKUs that are NOT in optimal locations.
    const mislocatedInventory = await Inventory.find({
      location: { $nin: optimalLocationIds } // Find inventory NOT IN optimal spots
    }).populate({
      path: 'sku',
      match: { velocity: 'A' } // ...where the SKU is a fast-mover
    }).populate('location');

    // Filter out results where the SKU didn't match the 'A' velocity
    const recommendations = mislocatedInventory
      .filter(item => item.sku) // Ensure the SKU exists (wasn't filtered out by populate)
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