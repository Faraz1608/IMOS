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
      .populate({ path: 'sku', select: 'skuCode name properties category' }) // --- FIX ---
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
    if (!skuId || !locationId || quantity == null || Number(quantity) <= 0) {
      return res.status(400).json({ message: 'Valid SKU, location, and quantity are required' });
    }

    const location = await Location.findById(locationId);
    if (!location) {
        return res.status(404).json({ message: 'Location not found.' });
    }

    const newSku = await Sku.findById(skuId);
    if (!newSku) {
        return res.status(404).json({ message: 'SKU not found.' });
    }

    const locationCapacityCm3 = getVolumeCm3(location.properties?.dimensions) * 1000000;
    if (locationCapacityCm3 === 0) {
        return res.status(400).json({ message: 'Cannot add to a location with zero capacity.' });
    }

    const inventoryInLocation = await Inventory.find({ location: locationId }).populate('sku');
    let currentOccupiedVolumeCm3 = 0;
    inventoryInLocation.forEach(item => {
        currentOccupiedVolumeCm3 += getVolumeCm3(item.sku?.properties?.dimensions) * item.quantity;
    });

    const newVolumeCm3 = getVolumeCm3(newSku.properties?.dimensions) * Number(quantity);
    const projectedVolumeCm3 = currentOccupiedVolumeCm3 + newVolumeCm3;

    if (projectedVolumeCm3 > locationCapacityCm3) {
        const remainingCapacityPercent = ((locationCapacityCm3 - currentOccupiedVolumeCm3) / locationCapacityCm3) * 100;
        return res.status(400).json({ message: `Adding this item would exceed location capacity. Only ${remainingCapacityPercent.toFixed(2)}% space remaining.` });
    }

    let inventory;
    const existingInventory = await Inventory.findOne({
        sku: skuId,
        location: locationId,
        batchNumber: batchNumber || null,
        serialNumber: serialNumber || null
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

    const finalUtilization = (projectedVolumeCm3 / locationCapacityCm3) * 100;
    if (finalUtilization >= 100) {
        const notification = await Notification.create({
            user: req.user.id,
            message: `Location ${location.locationCode} is now 100% utilized.`,
            link: `/layouts/${location.layout}/locations`
        });
        req.io.to(req.user.id).emit('new_notification', notification);
    }

    req.io.emit('inventory_updated');
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

    if (!inventoryItem) { return res.status(404).json({ message: 'Inventory record not found.' }); }
    if (!inventoryItem.sku || !inventoryItem.location) {
      return res.status(404).json({ message: 'Cannot adjust item. The associated SKU or Location has been deleted.' });
    }

    const location = inventoryItem.location;
    const locationCapacityCm3 = getVolumeCm3(location.properties?.dimensions) * 1000000;
    if (locationCapacityCm3 === 0) {
        return res.status(400).json({ message: 'Cannot adjust inventory in a location with zero capacity.' });
    }

    const inventoryInLocation = await Inventory.find({ location: location._id }).populate('sku');
    let currentOccupiedVolumeCm3 = 0;
    inventoryInLocation.filter(item => item.sku).forEach(item => {
        currentOccupiedVolumeCm3 += getVolumeCm3(item.sku.properties?.dimensions) * item.quantity;
    });

    const oldQuantity = inventoryItem.quantity;
    const quantityChange = Number(quantity) - oldQuantity;
    const volumeChangeCm3 = getVolumeCm3(inventoryItem.sku.properties?.dimensions) * quantityChange;
    const projectedVolumeCm3 = currentOccupiedVolumeCm3 + volumeChangeCm3;

    if (projectedVolumeCm3 > locationCapacityCm3) {
        const remainingCapacityPercent = ((locationCapacityCm3 - currentOccupiedVolumeCm3) / locationCapacityCm3) * 100;
        return res.status(400).json({ message: `This adjustment would exceed location capacity. Only ${remainingCapacityPercent.toFixed(2)}% space remaining.` });
    }

    inventoryItem.quantity = Number(quantity);
    await inventoryItem.save();

    if (quantityChange !== 0) {
      const movementType = quantityChange > 0 ? 'GR' : 'GI';
      await Transaction.create({ sku: inventoryItem.sku._id, type: movementType, quantity: Math.abs(quantityChange), user: req.user.id });
      await InventoryMovement.create({ sku: inventoryItem.sku._id, type: movementType, quantity: Math.abs(quantityChange), user: req.user.id });
    }

    const finalUtilization = (projectedVolumeCm3 / locationCapacityCm3) * 100;
    if (finalUtilization >= 100) {
        const notification = await Notification.create({
            user: req.user.id,
            message: `Location ${location.locationCode} is now 100% utilized.`,
            link: `/layouts/${location.layout}/locations`
        });
        req.io.to(req.user.id).emit('new_notification', notification);
    }

    req.io.emit('inventory_updated');
    res.status(200).json(inventoryItem);
  } catch (error) {
    console.error("Adjust inventory error:", error);
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