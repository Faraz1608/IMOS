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
    const { name, description, properties } = req.body; // --- NEW ---
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const layout = await Layout.create({
      name,
      description,
      properties, // --- NEW ---
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
    const { name, description, properties } = req.body; // --- NEW ---
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
    layout.properties = properties || layout.properties; // --- NEW ---
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
// Get layout stats (now system-wide)
export const getLayoutStats = async (req, res) => {
  try {
    const layoutId = req.params.id;
    const layout = await Layout.findById(layoutId);

    if (!layout) {
        return res.status(404).json({ message: 'Layout not found' });
    }

    const layoutProps = layout.properties;
    const layoutCapacity = (layoutProps?.dimensions?.w || 0) * (layoutProps?.dimensions?.d || 0) * (layoutProps?.dimensions?.h || 0);

    if (layoutCapacity === 0) {
        return res.status(200).json({ layoutName: layout.name, utilization: 0 });
    }

    const layoutLocations = await Location.find({ layout: layoutId });
    let totalLocationsVolume = 0;
    for (const loc of layoutLocations) {
        const props = loc.properties;
        if (props && props.dimensions) {
            totalLocationsVolume += (props.dimensions.w || 0) * (props.dimensions.d || 0) * (props.dimensions.h || 0);
        }
    }

    const utilization = (totalLocationsVolume / layoutCapacity) * 100;

    res.status(200).json({
      layoutName: layout.name,
      utilization: parseFloat(utilization.toFixed(2)),
    });
  } catch (error) {
    console.error('Error in getLayoutStats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};