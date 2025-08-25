import Layout from '../models/Layout.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';

// ... (getLayouts, createLayout, and getLayoutById functions remain the same) ...
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
    if (!layout) {
      return res.status(404).json({ message: 'Layout not found' });
    }
    if (layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.status(200).json(layout);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- REWRITTEN FUNCTION ---
// @desc    Update a layout
// @route   PUT /api/layouts/:id
export const updateLayout = async (req, res) => {
  try {
    const { name, description } = req.body;
    const layoutId = req.params.id;

    const layout = await Layout.findById(layoutId);

    if (!layout) {
      return res.status(404).json({ message: 'Layout not found' });
    }

    if (layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // If the name is being changed, check if the new name is already taken
    if (name && name !== layout.name) {
      const existingLayout = await Layout.findOne({ name: name });
      if (existingLayout) {
        return res.status(400).json({ message: 'Another layout with this name already exists.' });
      }
    }

    // Update the fields and save the document
    layout.name = name || layout.name;
    layout.description = description === undefined ? layout.description : description;
    const updatedLayout = await layout.save();

    res.status(200).json(updatedLayout);
  } catch (error) {
    console.error('Error updating layout:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// ... (deleteLayout and getLayoutStats functions remain the same) ...
export const deleteLayout = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({ message: 'Layout not found' });
    }
    if (layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await layout.deleteOne();
    res.status(200).json({ message: 'Layout removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getLayoutStats = async (req, res) => {
  try {
    const layoutId = req.params.id;
    const layout = await Layout.findById(layoutId);

    if (!layout || layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const layoutLocations = await Location.find({ layout: layoutId });
    const totalLocations = layoutLocations.length;

    if (totalLocations === 0) {
      return res.status(200).json({
        layoutName: layout.name,
        totalLocations: 0,
        occupiedLocations: 0,
        spaceUtilization: '0.00%',
      });
    }

    const locationIds = layoutLocations.map(loc => loc._id);

    const occupiedLocationIds = await Inventory.distinct('location', {
      location: { $in: locationIds },
    });
    const occupiedLocations = occupiedLocationIds.length;

    const spaceUtilization = (occupiedLocations / totalLocations) * 100;

    res.status(200).json({
      layoutName: layout.name,
      totalLocations,
      occupiedLocations,
      spaceUtilization: `${spaceUtilization.toFixed(2)}%`,
    });
  } catch (error) {
    console.error('Error in getLayoutStats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};