import Layout from '../models/Layout.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';
import Sku from '../models/Sku.js';

// Get all layouts in the system
export const getLayouts = async (req, res) => {
  try {
    const layouts = await Layout.find({});
    res.status(200).json(layouts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create a layout, associated with the creator for auditing
export const createLayout = async (req, res) => {
  try {
    const { name, description, properties } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const layout = await Layout.create({
      name,
      description,
      properties,
      createdBy: req.user.id,
    });
    res.status(201).json(layout);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A layout with this name already exists.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get a layout by its ID
export const getLayoutById = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({ message: 'Layout not found' });
    }
    res.status(200).json(layout);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update any layout
export const updateLayout = async (req, res) => {
  try {
    const { name, description, properties } = req.body;
    const layoutId = req.params.id;

    const layout = await Layout.findById(layoutId);

    if (!layout) {
      return res.status(404).json({ message: 'Layout not found' });
    }

    if (name && name !== layout.name) {
      const existingLayout = await Layout.findOne({ name: name });
      if (existingLayout) {
        return res.status(400).json({ message: 'Another layout with this name already exists.' });
      }
    }

    layout.name = name || layout.name;
    layout.description = description === undefined ? layout.description : description;
    layout.properties = properties || layout.properties;
    const updatedLayout = await layout.save();

    res.status(200).json(updatedLayout);
  } catch (error) {
    console.error('Error updating layout:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete any layout
export const deleteLayout = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({ message: 'Layout not found' });
    }
    await layout.deleteOne();
    res.status(200).json({ message: 'Layout removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- UPDATED FUNCTION ---
// Get layout stats, now based on SKU volume vs Location Capacity
export const getLayoutStats = async (req, res) => {
  try {
    const layoutId = req.params.id;
    const layout = await Layout.findById(layoutId);

    if (!layout) {
        return res.status(404).json({ message: 'Layout not found' });
    }

    // 1. Get all locations in this layout
    const layoutLocations = await Location.find({ layout: layoutId });
    
    // 2. Calculate Total Capacity (Sum of Location Volumes in cm³)
    let totalCapacityCm3 = 0;
    const locationIds = [];
    
    for (const loc of layoutLocations) {
        const props = loc.properties;
        if (props && props.dimensions) {
            const volM3 = (props.dimensions.w || 0) * (props.dimensions.d || 0) * (props.dimensions.h || 0);
            totalCapacityCm3 += volM3 * 1000000; // Convert to cm³
        }
        locationIds.push(loc._id);
    }

    if (totalCapacityCm3 === 0) {
        return res.status(200).json({ layoutName: layout.name, utilization: 0 });
    }

    // 3. Get all Inventory in these locations
    const inventoryInLayout = await Inventory.find({ location: { $in: locationIds } }).populate('sku');

    // 4. Calculate Total Occupied Volume (Sum of SKU Volumes in cm³)
    let totalOccupiedCm3 = 0;
    for (const item of inventoryInLayout) {
        if (item.sku && item.sku.properties && item.sku.properties.dimensions) {
            const skuDims = item.sku.properties.dimensions;
            const skuVolCm3 = (skuDims.w || 0) * (skuDims.d || 0) * (skuDims.h || 0);
            totalOccupiedCm3 += skuVolCm3 * item.quantity;
        }
    }

    // 5. Calculate Utilization
    let utilization = (totalOccupiedCm3 / totalCapacityCm3) * 100;
    utilization = Math.min(utilization, 100);

    const formatUtilization = (val) => {
        if (val === 0) return 0;
        if (val < 0.01) return parseFloat(val.toFixed(10));
        return parseFloat(val.toFixed(2));
    };

    res.status(200).json({
      layoutName: layout.name,
      utilization: formatUtilization(utilization),
    });
  } catch (error) {
    console.error('Error in getLayoutStats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};