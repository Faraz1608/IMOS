import Location from '../models/Location.js';
import Layout from '../models/Layout.js';
import Inventory from '../models/Inventory.js';

// Get all locations for a specific layout
export const getLocations = async (req, res) => {
  try {
    // No ownership check on the layout is needed in a collaborative model
    const locations = await Location.find({ layout: req.params.layoutId });
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Add a new location to a layout
export const addLocation = async (req, res) => {
  try {
    const { locationCode, properties } = req.body;
    if (!locationCode) {
      return res.status(400).json({ message: 'Location code is required' });
    }
    
    const location = await Location.create({
      layout: req.params.layoutId,
      locationCode,
      properties,
      createdBy: req.user.id, // Keep creator for auditing
    });

    req.io.emit('locations_updated');
    res.status(201).json(location);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Location code already exists for this layout.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update any location
export const updateLocation = async (req, res) => {
  try {
    const { locationCode, properties } = req.body;
    let location = await Location.findById(req.params.locationId);

    if (!location) { // REMOVED: Ownership check
      return res.status(404).json({ message: 'Location not found.' });
    }

    location.locationCode = locationCode || location.locationCode;
    location.properties = properties || location.properties;
    await location.save();

    req.io.emit('locations_updated');
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete any location
export const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.locationId);

    if (!location) { // REMOVED: Ownership check
      return res.status(404).json({ message: 'Location not found.' });
    }
    
    // Also delete all inventory records within this location
    await Inventory.deleteMany({ location: req.params.locationId });
    
    await location.deleteOne();

    req.io.emit('locations_updated');
    res.status(200).json({ message: 'Location and its inventory removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get stats for any location
export const getLocationStats = async (req, res) => {
    try {
        const locationId = req.params.locationId;
        const location = await Location.findById(locationId);

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        const locProps = location.properties;
        const locationCapacity = (locProps?.dimensions?.w || 0) * (locProps?.dimensions?.d || 0) * (locProps?.dimensions?.h || 0);

        if (locationCapacity === 0) {
            return res.status(200).json({ locationId, spaceUtilization: '0.00' });
        }

        const inventoryInLocation = await Inventory.find({ location: locationId }).populate('sku');

        let totalOccupiedVolume = 0;
        for (const item of inventoryInLocation) {
            const skuProps = item.sku?.properties;
            const skuVolumeCm3 = (skuProps?.dimensions?.w || 0) * (skuProps?.dimensions?.d || 0) * (skuProps?.dimensions?.h || 0);
            totalOccupiedVolume += (skuVolumeCm3 / 1000000) * item.quantity;
        }

        const utilization = (totalOccupiedVolume / locationCapacity) * 100;

        res.status(200).json({
            locationId,
            spaceUtilization: utilization.toFixed(2),
        });
    } catch (error) {
        console.error('Error in getLocationStats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
