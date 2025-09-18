import Inventory from '../models/Inventory.js';
import Transaction from '../models/Transaction.js';
import InventoryMovement from '../models/InventoryMovement.js';

// Get all inventory in the system
export const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({}) // REMOVED: User-specific filter
      .populate({ path: 'sku', select: 'skuCode name properties' })
      .populate({ 
        path: 'location', 
        select: 'locationCode layout',
        populate: {
          path: 'layout',
          select: 'name'
        }
      });
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Set inventory, associated with the creator for auditing
export const setInventory = async (req, res) => {
  try {
    const { skuId, locationId, quantity, batchNumber, serialNumber } = req.body;
    if (!skuId || !locationId || quantity == null) {
      return res.status(400).json({ message: 'SKU, location, and quantity are required' });
    }

    let inventory;
    // Find an existing inventory item for the SKU and location, ignoring batch/serial for aggregation
    const existingInventory = await Inventory.findOne({ sku: skuId, location: locationId });

    if (existingInventory) {
      // If it exists, update the quantity
      existingInventory.quantity += Number(quantity);
      inventory = await existingInventory.save();
    } else {
      // If it doesn't exist, create a new record
      inventory = await Inventory.create({
        sku: skuId,
        location: locationId,
        quantity: quantity,
        batchNumber,
        serialNumber,
        createdBy: req.user.id
      });
    }
    
    await Transaction.create({ sku: skuId, type: 'GR', quantity: quantity, user: req.user.id });
    await InventoryMovement.create({ sku: skuId, type: 'GR', quantity: quantity, user: req.user.id });
    
    req.io.emit('inventory_updated');
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Adjust any inventory item
export const adjustInventory = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity == null) {
      return res.status(400).json({ message: 'Quantity is required' });
    }

    const inventoryItem = await Inventory.findById(req.params.id);
    if (!inventoryItem) { // REMOVED: Ownership check
      return res.status(404).json({ message: 'Inventory record not found.' });
    }

    const oldQuantity = inventoryItem.quantity;
    const quantityChange = quantity - oldQuantity;
    inventoryItem.quantity = quantity;
    await inventoryItem.save();

    if (quantityChange !== 0) {
      const movementType = quantityChange > 0 ? 'GR' : 'GI';
      await Transaction.create({ sku: inventoryItem.sku, type: movementType, quantity: Math.abs(quantityChange), user: req.user.id });
      await InventoryMovement.create({ sku: inventoryItem.sku, type: movementType, quantity: Math.abs(quantityChange), user: req.user.id });
    }

    req.io.emit('inventory_updated');
    res.status(200).json(inventoryItem);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete any inventory item
export const deleteInventory = async (req, res) => {
  try {
    const inventoryItem = await Inventory.findByIdAndDelete(req.params.id);
    if (!inventoryItem) { // REMOVED: Ownership check
      return res.status(404).json({ message: 'Inventory record not found.' });
    }
    
    await Transaction.create({ sku: inventoryItem.sku, type: 'GI', quantity: inventoryItem.quantity, user: req.user.id });
    await InventoryMovement.create({ sku: inventoryItem.sku, type: 'GI', quantity: inventoryItem.quantity, user: req.user.id });

    req.io.emit('inventory_updated');
    res.status(200).json({ message: 'Inventory record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Move any inventory item
export const moveInventory = async (req, res) => {
  try {
    const { newLocationId } = req.body;
    if (!newLocationId) {
      return res.status(400).json({ message: 'New location ID is required' });
    }

    const inventoryItem = await Inventory.findById(req.params.id);
    if (!inventoryItem) { // REMOVED: Ownership check
      return res.status(404).json({ message: 'Inventory record not found.' });
    }

    inventoryItem.location = newLocationId;
    await inventoryItem.save();

    await Transaction.create({ sku: inventoryItem.sku, type: 'ST', quantity: inventoryItem.quantity, user: req.user.id });
    await InventoryMovement.create({ sku: inventoryItem.sku, type: 'ST', quantity: inventoryItem.quantity, user: req.user.id });

    req.io.emit('inventory_updated');
    res.status(200).json(inventoryItem);
  } catch (error) {
    console.error('Error moving inventory:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

