import Inventory from '../models/Inventory.js';
import Transaction from '../models/Transaction.js';
import InventoryMovement from '../models/InventoryMovement.js';
import Location from '../models/Location.js';
import Layout from '../models/Layout.js';
import Sku from '../models/Sku.js';
import Notification from '../models/Notification.js';


// Helper function to calculate volume
const getVolumeCm3 = (dimensions) => {
    return (dimensions?.w || 0) * (dimensions?.d || 0) * (dimensions?.h || 0);
};
// Get all inventory in the system
export const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({})
      .populate({ path: 'sku', select: 'skuCode name properties category' })
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

// Set inventory
export const setInventory = async (req, res) => {
  try {
    const { skuId, locationId, quantity, batchNumber, serialNumber } = req.body;
    if (!skuId || !locationId || quantity == null || Number(quantity) <= 0) {
      return res.status(400).json({ message: 'Valid SKU, location, and quantity are required' });
    }

    const location = await Location.findById(locationId);
    if (!location) return res.status(404).json({ message: 'Location not found.' });

    const newSku = await Sku.findById(skuId);
    if (!newSku) return res.status(404).json({ message: 'SKU not found.' });

    const inventoryInLocation = await Inventory.find({ location: locationId }).populate('sku');

    // --- Volumetric Capacity Check ---
    const locationCapacityCm3 = getVolumeCm3(location.properties?.dimensions) * 1000000;
    let currentOccupiedVolumeCm3 = 0;
    inventoryInLocation.forEach(item => {
        if(item.sku) currentOccupiedVolumeCm3 += getVolumeCm3(item.sku.properties?.dimensions) * item.quantity;
    });
    const newVolumeCm3 = getVolumeCm3(newSku.properties?.dimensions) * Number(quantity);
    if (locationCapacityCm3 > 0 && (currentOccupiedVolumeCm3 + newVolumeCm3) > locationCapacityCm3) {
        return res.status(400).json({ message: `Exceeds location's volumetric capacity.` });
    }
    
    let inventory;
    const existingInventory = await Inventory.findOne({
        sku: skuId,
        location: locationId,
        // Match exactly what is sent (even if it's an empty string)
        batchNumber: batchNumber, 
        serialNumber: serialNumber
    });

    if (existingInventory) {
      existingInventory.quantity += Number(quantity);
      inventory = await existingInventory.save();
    } else {
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

    // Low Stock Alert
    if (inventory.quantity < 10) {
        const skuCode = newSku.skuCode;
        const locCode = location.locationCode;
        await Notification.create({
            user: null,
            message: `Low Stock Alert: SKU ${skuCode} is down to ${inventory.quantity} units in ${locCode}.`,
            link: '/inventory'
        });
    }

    // New Stock Alert (Global)
    if (Number(quantity) > 0) {
        await Notification.create({
            user: null,
            message: `New stock added: ${Number(quantity)} units of ${newSku.name} (${newSku.skuCode}) added to ${location.locationCode}.`,
            link: '/inventory'
        });
    }

    res.status(200).json(inventory);
  } catch (error) {
    console.error("Set inventory error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Adjust any inventory item
export const adjustInventory = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity == null || Number(quantity) < 0) {
      return res.status(400).json({ message: 'A valid quantity is required' });
    }

    const inventoryItem = await Inventory.findById(req.params.id).populate('sku').populate('location');

    if (!inventoryItem) return res.status(404).json({ message: 'Inventory record not found.' });
    if (!inventoryItem.sku || !inventoryItem.location) {
      return res.status(404).json({ message: 'Associated SKU or Location has been deleted.' });
    }
    
    const quantityChange = Number(quantity) - inventoryItem.quantity;
    
    if (quantityChange > 0) {
        const location = inventoryItem.location;
        const inventoryInLocation = await Inventory.find({ location: location._id }).populate('sku');

        const locationCapacityCm3 = getVolumeCm3(location.properties?.dimensions) * 1000000;
        let currentOccupiedVolumeCm3 = 0;
        inventoryInLocation.forEach(item => {
            if(item.sku) currentOccupiedVolumeCm3 += getVolumeCm3(item.sku.properties?.dimensions) * item.quantity;
        });
        const volumeChangeCm3 = getVolumeCm3(inventoryItem.sku.properties?.dimensions) * quantityChange;
        if (locationCapacityCm3 > 0 && (currentOccupiedVolumeCm3 + volumeChangeCm3) > locationCapacityCm3) {
            return res.status(400).json({ message: `Adjustment exceeds location's volumetric capacity.` });
        }
    }
    
    inventoryItem.quantity = Number(quantity);
    await inventoryItem.save();

    if (quantityChange !== 0) {
      const movementType = quantityChange > 0 ? 'GR' : 'GI';
      await Transaction.create({ sku: inventoryItem.sku._id, type: movementType, quantity: Math.abs(quantityChange), user: req.user.id });
      await InventoryMovement.create({ sku: inventoryItem.sku._id, type: movementType, quantity: Math.abs(quantityChange), user: req.user.id });
    }

    req.io.emit('inventory_updated');

    // Low Stock Alert
    if (inventoryItem.quantity < 10) {
        await Notification.create({
            user: null,
            message: `Low Stock Alert: SKU ${inventoryItem.sku.skuCode} is down to ${inventoryItem.quantity} units in ${inventoryItem.location.locationCode}.`,
            link: '/inventory'
        });
    }

    // Quantity Change Alert (Global)
    if (quantityChange !== 0) {
        const action = quantityChange > 0 ? 'added' : 'reduced';
        const msg = quantityChange > 0 
            ? `Stock added: ${Math.abs(quantityChange)} units of ${inventoryItem.sku.name} added to ${inventoryItem.location.locationCode}.`
            : `Stock reduced: ${Math.abs(quantityChange)} units of ${inventoryItem.sku.name} removed from ${inventoryItem.location.locationCode}.`;
            
        await Notification.create({
            user: null,
            message: msg,
            link: '/inventory'
        });
    }

    res.status(200).json(inventoryItem);
  } catch (error) {
    console.error("Adjust inventory error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

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