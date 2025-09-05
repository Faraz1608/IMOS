import Inventory from '../models/Inventory.js';
import Transaction from '../models/Transaction.js';

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

export const setInventory = async (req, res) => {
  try {
    const { skuId, locationId, quantity } = req.body;
    if (!skuId || !locationId || quantity == null) {
      return res.status(400).json({ message: 'SKU, location, and quantity are required' });
    }

    const inventory = await Inventory.findOneAndUpdate(
      { sku: skuId, location: locationId },
      { quantity, createdBy: req.user.id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    // Create a "Goods Receipt" transaction
    await Transaction.create({
      sku: skuId,
      type: 'GR',
      quantity: quantity,
      user: req.user.id,
    });
    
    // Broadcast real-time inventory update
    const populatedInventory = await Inventory.findById(inventory._id)
      .populate({ path: 'sku', select: 'skuCode name' })
      .populate({ 
        path: 'location', 
        select: 'locationCode layout',
        populate: {
          path: 'layout',
          select: 'name'
        }
      });
    
    req.socketService.broadcastInventoryUpdate('create', populatedInventory);
    
    res.status(200).json(inventory);
  } catch (error) {
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

    // Create a transaction based on the quantity change
    if (quantityChange !== 0) {
      await Transaction.create({
        sku: inventoryItem.sku,
        type: quantityChange > 0 ? 'GR' : 'GI',
        quantity: Math.abs(quantityChange),
        user: req.user.id,
      });
    }

    // Broadcast real-time inventory update
    const populatedInventory = await Inventory.findById(inventoryItem._id)
      .populate({ path: 'sku', select: 'skuCode name' })
      .populate({ 
        path: 'location', 
        select: 'locationCode layout',
        populate: {
          path: 'layout',
          select: 'name'
        }
      });
    
    req.socketService.broadcastInventoryUpdate('update', populatedInventory);
    
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
    
    // Create a "Goods Issue" transaction for the removed quantity
    await Transaction.create({
        sku: inventoryItem.sku,
        type: 'GI',
        quantity: inventoryItem.quantity,
        user: req.user.id,
    });

    // Broadcast real-time inventory deletion
    req.socketService.broadcastInventoryUpdate('delete', { _id: inventoryItem._id });
    
    res.status(200).json({ message: 'Inventory record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};