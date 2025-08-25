import Inventory from '../models/Inventory.js';
import Sku from '../models/Sku.js';
import Location from '../models/Location.js';

// --- No changes needed for getInventory, setInventory, getInventoryByLocation, getInventoryBySKU ---
export const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({ createdBy: req.user.id })
      .populate({ path: 'sku', select: 'skuCode name' })
      .populate({ path: 'location', select: 'locationCode _id' });
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
    let inventory = await Inventory.findOneAndUpdate(
      { sku: skuId, location: locationId },
      { quantity, createdBy: req.user.id },
      { new: true, upsert: true }
    );
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error setting inventory:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
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
// --- Start of changes ---

export const adjustInventory = async (req, res) => {
  try {
    const { quantity } = req.body; // We only need the new quantity from the body
    if (quantity == null) {
      return res.status(400).json({ message: 'Quantity is required' });
    }

    const updatedInventory = await Inventory.findByIdAndUpdate(
      req.params.id, // Find the document by its unique _id from the URL
      { quantity: quantity }, // Set the new quantity
      { new: true }
    );

    if (!updatedInventory) {
      return res.status(404).json({ message: 'Inventory record not found.' });
    }

    res.status(200).json(updatedInventory);
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const result = await Inventory.findByIdAndDelete(req.params.id); // Find and delete by _id

    if (!result) {
      return res.status(404).json({ message: 'Inventory record not found.' });
    }

    res.status(200).json({ message: 'Inventory record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};