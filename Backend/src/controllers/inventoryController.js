import Inventory from '../models/Inventory.js';
import Sku from '../models/Sku.js'; // Ensure correct casing
import Location from '../models/Location.js';

// @desc    Add or update inventory for an SKU at a location
// @route   POST /api/inventory
// @desc    Get all inventory records for the user
// @route   GET /api/inventory
export const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({ createdBy: req.user.id })
      .populate({ path: 'sku', select: 'skuCode name' })
      .populate({ path: 'location', select: 'locationCode' });
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
export const setInventory = async (req, res) => {
  try {
    const { skuId, locationId, quantity } = req.body;
    if (!skuId || !locationId || quantity == null) {
      return res.status(400).json({ message: 'SKU, location, and quantity are required' });
    }
    
    // Find existing inventory record or 
    let inventory=null;

    inventory = await Inventory.findOneAndUpdate(
      { sku: skuId, location: locationId },
      { quantity, createdBy: req.user.id },
      { new: true, upsert: true } // `upsert: true` creates the doc if it doesn't exist
    );



    if(!inventory){
      inventory= new Inventory({
        sku: skuId, location: locationId , quantity
      })
    }


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
export const adjustInventory = async (req, res) => {
  try {
    const { skuId, locationId, adjustment } = req.body;
    if (!skuId || !locationId || !adjustment) {
      return res.status(400).json({ message: 'SKU, location, and adjustment value are required' });
    }

    // Use MongoDB's $inc operator to safely increment/decrement the quantity
    const updatedInventory = await Inventory.findOneAndUpdate(
      { sku: skuId, location: locationId },
      { $inc: { quantity: adjustment } },
      { new: true } // Return the updated document
    );

    if (!updatedInventory) {
      return res.status(404).json({ message: 'Inventory record not found. Use POST to create it first.' });
    }

    res.status(200).json(updatedInventory);
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete an inventory record
// @route   DELETE /api/inventory
export const deleteInventory = async (req, res) => {
  try {
    const { skuId, locationId } = req.body;
    if (!skuId || !locationId) {
      return res.status(400).json({ message: 'SKU and location are required' });
    }

    const result = await Inventory.deleteOne({ sku: skuId, location: locationId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Inventory record not found.' });
    }

    res.status(200).json({ message: 'Inventory record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};