import Inventory from '../models/Inventory.model.js';
import Sku from '../models/Sku.js'; // Ensure correct casing
import Location from '../models/Location.js';

// @desc    Add or update inventory for an SKU at a location
// @route   POST /api/inventory
export const setInventory = async (req, res) => {
  try {
    const { skuId, locationId, quantity } = req.body;
    if (!skuId || !locationId || quantity == null) {
      return res.status(400).json({ message: 'SKU, location, and quantity are required' });
    }
    
    // Find existing inventory record or create a new one
    const inventory = await Inventory.findOneAndUpdate(
      { sku: skuId, location: locationId },
      { quantity, createdBy: req.user.id },
      { new: true, upsert: true } // `upsert: true` creates the doc if it doesn't exist
    );

    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error setting inventory:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get inventory for a specific location
// @route   GET /api/inventory/location/:locationId
export const getInventoryByLocation = async (req, res) => {
    try {
        const inventory = await Inventory.find({ location: req.params.locationId }).populate('sku');
        res.status(200).json(inventory);
    } catch (error) {
        console.error('Error getting inventory by location:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
export const getInventoryBySKU = async (req, res) => {
    try {
        const inventory = await Inventory.find({ sku: req.params.skuId }).populate('location');
        res.status(200).json(inventory);
    } catch (error) {
        console.error('Error getting inventory by SKU:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};