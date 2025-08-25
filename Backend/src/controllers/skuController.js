import Sku from '../models/Sku.js';
import Inventory from '../models/Inventory.js'; // Import the Inventory model

// --- No changes to getSKUs, createSKU, searchSkus, getSkuById, updateSku ---
export const getSKUs = async (req, res) => {
  try {
    const skus = await Sku.find({});
    res.status(200).json(skus);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

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
      createdBy: req.user.id,
    });
    res.status(201).json(sku);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This SKU code already exists.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

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

export const getSkuById = async (req, res) => {
  try {
    const sku = await Sku.findById(req.params.id);

    if (!sku || !sku.createdBy || sku.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.status(200).json(sku);
  } catch (error) {
    console.error('Error in getSkuById:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateSku = async (req, res) => {
  try {
    let sku = await Sku.findById(req.params.id);
    if (!sku || !sku.createdBy || sku.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    sku = await Sku.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(sku);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- MODIFIED FUNCTION ---
export const deleteSku = async (req, res) => {
  try {
    const sku = await Sku.findById(req.params.id);

    if (!sku) {
      return res.status(404).json({ message: 'SKU not found' });
    }

    if (sku.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Before deleting the SKU, delete all inventory records referencing it
    await Inventory.deleteMany({ sku: req.params.id });

    // Now, delete the SKU itself
    await sku.deleteOne();

    res.status(200).json({ message: 'SKU and associated inventory removed' });
  } catch (error) {
    console.error('Error deleting SKU:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};