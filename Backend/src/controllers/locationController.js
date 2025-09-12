import Location from '../models/Location.js';
import Layout from '../models/Layout.js';
import Inventory from '../models/Inventory.js';

// --- getLocations function remains the same ---
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

    req.io.emit('locations_updated'); // Emit event

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
    const { locationCode, properties } = req.body;
    let location = await Location.findById(req.params.locationId);

    if (!location || location.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    location.locationCode = locationCode || location.locationCode;
    location.properties = properties || location.properties;
    await location.save();

    req.io.emit('locations_updated'); // Emit event

    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.locationId);

    if (!location || location.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await location.deleteOne();

    req.io.emit('locations_updated'); // Emit event
    
    res.status(200).json({ message: 'Location removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- getLocationStats function remains the same ---
export const getLocationStats = async (req, res) => {
    try {
        const locationId = req.params.locationId;
        const location = await Location.findById(locationId);

        if (!location || location.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        let totalLocationCapacity = 0;
        if (location.properties && location.properties.dimensions) {
            const dims = location.properties.dimensions;
            if (dims.w && dims.d && dims.h) {
                totalLocationCapacity = dims.w * dims.d * dims.h;
            }
        }

        if (totalLocationCapacity === 0) {
            return res.status(200).json({ utilization: 0 });
        }

        const inventoryInLocation = await Inventory.find({ location: locationId }).populate('sku');

        let totalOccupiedVolume = 0;
        for (const item of inventoryInLocation) {
            if (item.sku && item.sku.properties && item.sku.properties.dimensions) {
                const skuDims = item.sku.properties.dimensions;
                if (skuDims.w && skuDims.d && skuDims.h) {
                    totalOccupiedVolume += (skuDims.w * skuDims.d * skuDims.h) * item.quantity;
                }
            }
        }
        const utilization = (totalOccupiedVolume / totalLocationCapacity) * 100;

        res.status(200).json({ utilization: parseFloat(utilization.toFixed(2)) });

    } catch (error) {
        console.error('Error getting location stats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

