import Layout from '../models/Layout.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';
import Sku from '../models/Sku.js';

// --- getLayouts, createLayout, getLayoutById, updateLayout, deleteLayout functions remain the same ---
export const getLayouts = async (req, res) => {
  try {
    const layouts = await Layout.find({ createdBy: req.user.id });
    res.status(200).json(layouts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createLayout = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const layout = await Layout.create({
      name,
      description,
      createdBy: req.user.id,
    });
    req.io.emit('layouts_updated');
    res.status(201).json(layout);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A layout with this name already exists.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getLayoutById = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout || layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.status(200).json(layout);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateLayout = async (req, res) => {
  try {
    const { name, description } = req.body;
    let layout = await Layout.findById(req.params.id);
    if (!layout || layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (name && name !== layout.name) {
      const existingLayout = await Layout.findOne({ name: name, createdBy: req.user.id });
      if (existingLayout) {
        return res.status(400).json({ message: 'Another layout with this name already exists.' });
      }
    }
    layout.name = name || layout.name;
    layout.description = description === undefined ? layout.description : description;
    const updatedLayout = await layout.save();
    req.io.emit('layouts_updated');
    res.status(200).json(updatedLayout);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteLayout = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout || layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Advanced deletion: Also remove associated locations and inventory
    const locations = await Location.find({ layout: req.params.id });
    const locationIds = locations.map(l => l._id);
    await Inventory.deleteMany({ location: { $in: locationIds } });
    await Location.deleteMany({ layout: req.params.id });
    await layout.deleteOne();

    req.io.emit('layouts_updated');
    res.status(200).json({ message: 'Layout and all associated data removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- Upgraded getLayoutStats function ---
export const getLayoutStats = async (req, res) => {
  try {
    const layoutId = req.params.id;
    const layout = await Layout.findById(layoutId);

    if (!layout || layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const locations = await Location.find({ layout: layoutId });
    const locationIds = locations.map(l => l._id);

    // Calculate total volumetric capacity of the layout
    const totalCapacity = locations.reduce((acc, loc) => {
        const dims = loc.properties?.dimensions;
        if (dims && dims.w > 0 && dims.d > 0 && dims.h > 0) {
            return acc + (dims.w * dims.d * dims.h);
        }
        return acc;
    }, 0);
    
    // Calculate total volume of SKUs stored in the layout
    const inventoryInLayout = await Inventory.find({ location: { $in: locationIds } }).populate({
        path: 'sku',
        select: 'properties'
    });
    
    const occupiedVolume = inventoryInLayout.reduce((acc, item) => {
        const skuDims = item.sku?.properties?.dimensions;
        if (skuDims && skuDims.w > 0 && skuDims.d > 0 && skuDims.h > 0) {
            return acc + (skuDims.w * skuDims.d * skuDims.h * item.quantity);
        }
        return acc;
    }, 0);

    const utilization = totalCapacity > 0 ? (occupiedVolume / totalCapacity) * 100 : 0;

    res.status(200).json({
      layoutName: layout.name,
      totalLocations: locations.length,
      spaceUtilization: `${utilization.toFixed(2)}%`,
    });
  } catch (error) {
    console.error('Error in getLayoutStats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

