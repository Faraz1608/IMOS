import Location from '../models/Location.js';
import Layout from '../models/Layout.js';
import Inventory from '../models/Inventory.js';

// --- HELPER FUNCTION ---
const getVolume = (dimensions) => {
    return (dimensions?.w || 0) * (dimensions?.d || 0) * (dimensions?.h || 0);
};

// Get all locations for a specific layout
export const getLocations = async (req, res) => {
  try {
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

    const layout = await Layout.findById(req.params.layoutId);
    if (!layout) {
        return res.status(404).json({ message: 'Layout not found.' });
    }

    const layoutProps = layout.properties;
    const layoutCapacity = (layoutProps?.dimensions?.w || 0) * (layoutProps?.dimensions?.d || 0) * (layoutProps?.dimensions?.h || 0);

    if (layoutCapacity > 0) {
        const locationsInLayout = await Location.find({ layout: req.params.layoutId });
        let currentTotalVolume = 0;
        locationsInLayout.forEach(loc => {
            const props = loc.properties;
            currentTotalVolume += (props?.dimensions?.w || 0) * (props?.dimensions?.d || 0) * (props?.dimensions?.h || 0);
        });

        const newLocationVolume = (properties?.dimensions?.w || 0) * (properties?.dimensions?.d || 0) * (properties?.dimensions?.h || 0);

        if ((currentTotalVolume + newLocationVolume) > layoutCapacity) {
            return res.status(400).json({ message: 'Adding this location would exceed the layout capacity.' });
        }
    }
    
    const location = await Location.create({
      layout: req.params.layoutId,
      locationCode,
      properties,
      createdBy: req.user.id,
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

    if (!location) {
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

    if (!location) {
      return res.status(404).json({ message: 'Location not found.' });
    }
    
    await Inventory.deleteMany({ location: req.params.locationId });
    
    await location.deleteOne();

    req.io.emit('locations_updated');
    res.status(200).json({ message: 'Location and its inventory removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- UPDATED FUNCTION ---
// Get stats for any location, now only calculating space
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
            // Convert SKU volume (cm³) to Location volume (m³)
            totalOccupiedVolume += (skuVolumeCm3 / 1000000) * item.quantity;
        }

        let utilization = (totalOccupiedVolume / locationCapacity) * 100;
        
        // --- FIX: Cap at 100% ---
        utilization = Math.min(utilization, 100);

        const formatUtilization = (val) => {
            if (val === 0) return 0;
            if (val < 0.01) return parseFloat(val.toFixed(10));
            return parseFloat(val.toFixed(2));
        };

        res.status(200).json({
            locationId,
            spaceUtilization: formatUtilization(utilization).toString(), // Keep as string for frontend consistency if needed, or change to number
        });
    } catch (error) {
        console.error('Error in getLocationStats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};