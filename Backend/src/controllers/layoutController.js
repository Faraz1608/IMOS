import Layout from '../models/Layout.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';

// @desc    Get all layouts for the logged-in user
// @route   GET /api/layouts
export const getLayouts = async (req, res) => {
  try {
    const layouts = await Layout.find({ createdBy: req.user.id });
    res.status(200).json(layouts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new layout
// @route   POST /api/layouts
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
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single layout by ID
// @route   GET /api/layouts/:id
export const getLayoutById = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({ message: 'Layout not found' });
    }
    // Ensure the logged-in user owns this layout
    if (layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.status(200).json(layout);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a layout
// @route   PUT /api/layouts/:id
export const updateLayout = async (req, res) => {
  try {
    let layout = await Layout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({ message: 'Layout not found' });
    }
    if (layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    layout = await Layout.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(layout);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a layout
// @route   DELETE /api/layouts/:id
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

// @desc    Get dashboard statistics for a layout
// @route   GET /api/layouts/:id/stats
export const getLayoutStats = async (req, res) => {
  try {
    const layoutId = req.params.id;
    const layout = await Layout.findById(layoutId);

    if (!layout || layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Find all locations belonging to this layout
    const layoutLocations = await Location.find({ layout: layoutId });
    const totalLocations = layoutLocations.length;

    // If there are no locations, return 0 stats
    if (totalLocations === 0) {
      return res.status(200).json({
        layoutName: layout.name,
        totalLocations: 0,
        occupiedLocations: 0,
        spaceUtilization: '0.00%',
      });
    }

    const locationIds = layoutLocations.map(loc => loc._id);

    // Find which of those locations have at least one item
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