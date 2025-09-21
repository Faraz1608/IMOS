import Sku from '../models/Sku.js';
import Inventory from '../models/Inventory.js';

/**
 * SKU Controller
 * Handles SKU management: CRUD operations, search, and inventory linkage
 */

// @desc    Get all SKUs in the system
// @route   GET /api/skus
export const getSKUs = async (req, res) => {
  try {
    const skus = await Sku.find({});
    res.status(200).json(skus);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new SKU (linked to creator for auditing)
// @route   POST /api/skus
export const createSKU = async (req, res) => {
  try {
    const { skuCode, name, description, properties, category } = req.body; // Add category
    if (!skuCode || !name) {
      return res.status(400).json({ message: 'SKU code and name are required' });
    }
    
    const sku = await Sku.create({
      skuCode,
      name,
      description,
      properties,
      category, // Add category
      createdBy: req.user.id, // Track user who created it
    });

    req.io.emit('skus_updated'); // Notify frontend via sockets
    res.status(201).json(sku);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This SKU code already exists.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Search SKUs by code or name
// @route   GET /api/skus/search?q=<term>
export const searchSkus = async (req, res) => {
  const query = req.query.q;
  try {
    const regex = new RegExp(query, 'i');
    const skus = await Sku.find({ 
      $or: [{ skuCode: regex }, { name: regex }],
    }).limit(10);
    res.status(200).json(skus);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get SKU by ID
// @route   GET /api/skus/:id
export const getSkuById = async (req, res) => {
  try {
    const sku = await Sku.findById(req.params.id);
    if (!sku) { 
      return res.status(404).json({ message: 'SKU not found' });
    }
    res.status(200).json(sku);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a SKU
// @route   PUT /api/skus/:id
export const updateSku = async (req, res) => {
  try {
    let sku = await Sku.findById(req.params.id);
    if (!sku) { 
      return res.status(404).json({ message: 'SKU not found' });
    }
    sku = await Sku.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.io.emit('skus_updated'); // Broadcast change
    res.status(200).json(sku);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a SKU and its inventory
// @route   DELETE /api/skus/:id
export const deleteSku = async (req, res) => {
  try {
    const sku = await Sku.findById(req.params.id);
    if (!sku) { 
      return res.status(404).json({ message: 'SKU not found' });
    }

    // Cascade delete: remove all inventory records linked to this SKU
    await Inventory.deleteMany({ sku: req.params.id });
    await sku.deleteOne();

    req.io.emit('skus_updated'); // Notify frontend
    res.status(200).json({ message: 'SKU and associated inventory removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};