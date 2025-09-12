import Inventory from '../models/Inventory.js';
import Transaction from '../models/Transaction.js';
import InventoryMovement from '../models/InventoryMovement.js';


// getInventory, adjustInventory, deleteInventory, moveInventory functions remain the same for now
// They can be enhanced later to work with batch/serial numbers if needed for specific actions.

export const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({ createdBy: req.user.id })
      .populate({ path: 'sku', select: 'skuCode name' })
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


// --- UPDATED setInventory FUNCTION ---
export const setInventory = async (req, res) => {
  try {
    const { skuId, locationId, quantity, batchNumber, serialNumber } = req.body;
    if (!skuId || !locationId || quantity == null) {
      return res.status(400).json({ message: 'SKU, location, and quantity are required' });
    }
    
    // If a serial number is provided, the quantity must be 1
    if (serialNumber && parseInt(quantity, 10) !== 1) {
        return res.status(400).json({ message: 'Quantity must be 1 for serialized items.' });
    }

    // The filter now includes batch and serial numbers to find a specific item record.
    const filter = { 
        sku: skuId, 
        location: locationId,
        batchNumber: batchNumber || null,
        serialNumber: serialNumber || null,
    };
    
    // The update includes the new fields and sets the quantity.
    const update = { 
        quantity, 
        createdBy: req.user.id 
    };

    // Use findOneAndUpdate with upsert to create the item if it doesn't exist or update it if it does.
    const inventory = await Inventory.findOneAndUpdate(filter, update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    // Create a "Goods Receipt" (GR) transaction and inventory movement.
    const movement = {
        sku: skuId,
        type: 'GR',
        quantity: quantity,
        user: req.user.id,
    };
    await Transaction.create(movement);
    await InventoryMovement.create(movement);
    
    // Notify connected clients that the inventory has been updated.
    req.io.emit('inventory_updated');
    res.status(200).json(inventory);
  } catch (error) {
    // Catch the specific error for duplicate keys (from our unique index).
    if (error.code === 11000) { 
        return res.status(400).json({ message: 'This exact item (SKU, location, batch/serial) already exists.' });
    }
    console.error("Error setting inventory:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const adjustInventory = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity == null) {
      return res.status(400).json({ message: 'Quantity is required' });
    }

    const inventoryItem = await Inventory.findById(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory record not found.' });
    }

    const oldQuantity = inventoryItem.quantity;
    const quantityChange = quantity - oldQuantity;

    inventoryItem.quantity = quantity;
    await inventoryItem.save();

    if (quantityChange !== 0) {
      const movementType = quantityChange > 0 ? 'GR' : 'GI';
      const movement = {
        sku: inventoryItem.sku,
        type: movementType,
        quantity: Math.abs(quantityChange),
        user: req.user.id,
      };
      await Transaction.create(movement);
      await InventoryMovement.create(movement);
    }

    req.io.emit('inventory_updated');
    res.status(200).json(inventoryItem);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const inventoryItem = await Inventory.findByIdAndDelete(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory record not found.' });
    }
    
    const movement = {
        sku: inventoryItem.sku,
        type: 'GI',
        quantity: inventoryItem.quantity,
        user: req.user.id,
    };
    await Transaction.create(movement);
    await InventoryMovement.create(movement);

    req.io.emit('inventory_updated');
    res.status(200).json({ message: 'Inventory record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const moveInventory = async (req, res) => {
  try {
    const { newLocationId } = req.body;
    if (!newLocationId) {
      return res.status(400).json({ message: 'New location ID is required' });
    }

    const inventoryItem = await Inventory.findById(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory record not found.' });
    }

    inventoryItem.location = newLocationId;
    await inventoryItem.save();
    
    const movement = {
      sku: inventoryItem.sku,
      type: 'ST',
      quantity: inventoryItem.quantity,
      user: req.user.id,
    };
    await Transaction.create(movement);
    await InventoryMovement.create(movement);
    
    req.io.emit('inventory_updated');
    res.status(200).json(inventoryItem);

  } catch (error) {
    console.error('Error moving inventory:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
