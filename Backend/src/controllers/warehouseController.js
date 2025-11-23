import Warehouse from '../models/Warehouse.js';
import Layout from '../models/Layout.js'; // --- NEW ---

// @desc    Get the single warehouse details
// @route   GET /api/warehouse
export const getWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findOne();
        res.status(200).json(warehouse);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create or update the single warehouse
// @route   POST /api/warehouse
export const createOrUpdateWarehouse = async (req, res) => {
    try {
        const { name, properties } = req.body;
        
        let warehouse = await Warehouse.findOne();
        if (warehouse) {
            warehouse.name = name || warehouse.name;
            warehouse.properties = properties || warehouse.properties;
        } else {
            warehouse = new Warehouse({
                name,
                properties,
                createdBy: req.user.id,
            });
        }
        
        const updatedWarehouse = await warehouse.save();
        res.status(200).json(updatedWarehouse);

    } catch (error) {
        console.error('Error in createOrUpdateWarehouse:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- NEW FUNCTION ---
// @desc    Get all layouts within the warehouse
// @route   GET /api/warehouse/layouts
export const getWarehouseLayouts = async (req, res) => {
    try {
        const warehouse = await Warehouse.findOne();
        if (!warehouse) {
            return res.status(404).json({ message: 'Warehouse not found.' });
        }
        const layouts = await Layout.find({ warehouse: warehouse._id });
        res.status(200).json(layouts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};