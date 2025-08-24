import Location from '../models/Location.js';
import Layout from '../models/Layout.js';

// @desc    Get all locations for a specific layout
// @route   GET /api/layouts/:layoutId/locations
export const getLocations = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.layoutId);
    if (!layout || layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const locations = await Location.find({ layout: req.params.layoutId });
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a new location to a layout
// @route   POST /api/layouts/:layoutId/locations
export const addLocation = async (req, res) => {
  try {
    const { locationCode, properties } = req.body;
    if (!locationCode) {
      return res.status(400).json({ message: 'Location code is required' });
    }

    const layout = await Layout.findById(req.params.layoutId);
    if (!layout || layout.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const location = await Location.create({
      layout: req.params.layoutId,
      locationCode,
      properties,
      createdBy: req.user.id,
    });
    res.status(201).json(location);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Location code already exists for this layout.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};
export const updateLocation = async (req, res) => {
  try {
    const { locationCode } = req.body;
    let location = await Location.findById(req.params.locationId);

    if (!location || location.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    location.locationCode = locationCode || location.locationCode;
    await location.save();
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a location
// @route   DELETE /api/layouts/:layoutId/locations/:locationId
export const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.locationId);

    if (!location || location.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Optional: Add logic here to check if inventory exists at this location before deleting.
    
    await location.deleteOne();
    res.status(200).json({ message: 'Location removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};