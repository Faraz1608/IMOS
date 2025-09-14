import Sku from '../models/Sku.js';
import Inventory from '../models/Inventory.js';

// Get all SKUs in the system, regardless of who created them
export const getSKUs = async (req, res) => {
  try {
    const skus = await Sku.find({}); // REMOVED: User-specific filter
    res.status(200).json(skus);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create a SKU, associated with the creator for auditing
export const createSKU = async (req, res) => {
  try {
    const { skuCode, name, description, properties } = req.body;
    if (!skuCode || !name) {
      return res.status(400).json({ message: 'SKU code and name are required' });
    }
    
    const sku = await Sku.create({
      skuCode,
      name,
      description,
      properties,
      createdBy: req.user.id, // Keep creator for auditing
    });

    req.io.emit('skus_updated');
    res.status(201).json(sku);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This SKU code already exists.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Search all SKUs in the system
export const searchSkus = async (req, res) => {
  const query = req.query.q;
  try {
    const regex = new RegExp(query, 'i');
    const skus = await Sku.find({ // REMOVED: User-specific filter
      $or: [{ skuCode: regex }, { name: regex }],
    }).limit(10);
    res.status(200).json(skus);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get a SKU by its ID
export const getSkuById = async (req, res) => {
  try {
    const sku = await Sku.findById(req.params.id);
    if (!sku) { // Simplified check: just see if it exists
      return res.status(404).json({ message: 'SKU not found' });
    }
    res.status(200).json(sku);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update any SKU
export const updateSku = async (req, res) => {
  try {
    let sku = await Sku.findById(req.params.id);
    if (!sku) { // REMOVED: Ownership check
      return res.status(404).json({ message: 'SKU not found' });
    }
    sku = await Sku.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.io.emit('skus_updated');
    res.status(200).json(sku);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete any SKU
export const deleteSku = async (req, res) => {
  try {
    const sku = await Sku.findById(req.params.id);
    if (!sku) { // REMOVED: Ownership check
      return res.status(404).json({ message: 'SKU not found' });
    }

    await Inventory.deleteMany({ sku: req.params.id });
    await sku.deleteOne();
    req.io.emit('skus_updated');
    res.status(200).json({ message: 'SKU and associated inventory removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

